import { getAr, postAr } from "../models/model.js";
import { google } from "googleapis";
import { file } from "googleapis/build/src/apis/file/index.js";
import { NodeIO } from '@gltf-transform/core';

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
)

oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

const drive = google.drive({
    version: "v3",
    auth: oauth2Client
})

async function getNewAccessToken(refreshToken, clientId, clientSecret) {
    const response = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        }
    });
    return response.data.access_token;
}

async function uploadFile(arquivo, bodyData) {
    try {
        const newAccessToken = await getNewAccessToken(process.env.REFRESH_TOKEN, process.env.CLIENT_ID, process.env.CLIENT_SECRET);
        const folderId = "1Ms9AE4JfTfAmdBtcN0aP_3TVVpwYiuVO";
        const form = new FormData();
        const nomeArquivo = `${bodyData.username}-${bodyData.nome}-${bodyData.timestamp}.glb`;

        form.append('metadata', JSON.stringify({
            name: nomeArquivo,
            mimeType: 'model/gltf-binary',
            parents: [folderId]
        }), {
            contentType: 'application/json'
        });

        form.append('file', arquivo, {
            filename: nomeArquivo,
            contentType: 'model/gltf-binary'
        });

        const res = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', form, {
            headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                ...form.getHeaders()
            }
        });

        await tornarPublico(res.data.id)

        console.log(res.data);

        return res.data.id;
    } catch (erro) {
        console.log("Erro ao fazer upload para o Google Drive: " + erro)
    }
}

async function tornarPublico(id) {
    try {
        await drive.permissions.create({
            fileId: id,
            requestBody: {
                role: "reader",
                type: "anyone"
            }
        })
        console.log(`Arquivo com ID ${id} agora está público.`);
    } catch (erro) {
        console.log(erro.message)
    }
}




export async function listarAr(req, res) {
    const models = await getAr();
    return res.status(200).json(models);
}

export async function cadastrarAr(req, res) {
    console.log("ar executado")
    try {
        const fileId = req.body.driveId;
        console.log("fileId: " + fileId)

        const resultado = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        const buffer = Buffer.from(resultado.data);

        const io = new NodeIO();
        const doc = await io.readBinary(buffer); // Use readBinary para arquivos .glb

        const root = doc.getRoot();
        const animations = root.listAnimations();

        animations.forEach(anim => {
            if (anim.getName().toLowerCase() !== req.body.animacao.toLowerCase()) {
                anim.dispose();
            }
        });

        const arrayBuffer = await io.writeBinary(doc);
        const novoBuffer = Buffer.from(arrayBuffer);

        console.log('Arquivo enviado! :D')

        const newDriveId = await uploadFile(novoBuffer, req.body);

        await postAr({
            username: req.body.username,
            driveId: newDriveId,
            nome: req.body.nome,
            animacao: req.body.animacao,
            timestamp: req.body.timestamp
        })

        return res.status(200).json({
            newDriveId: newDriveId,
        });

    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}