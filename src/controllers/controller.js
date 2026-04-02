import { getAr, postAr, deleteAr } from "../models/model.js";
import { NodeIO } from '@gltf-transform/core';




export async function uploadToVercelBlob(buffer, pathname, contentType) {
    const blob = await put(pathname, buffer, {
        access: 'public', // ou 'private', dependendo do seu caso
        token: process.env.BLOB_READ_WRITE_TOKEN,
        content_type: contentType,
    });

    // blob.url é a URL base e blob.downloadUrl força o download
    return blob.url;
}

export async function deleteFile(blobPath) {
    try {
        await del(blobPath, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        console.log(`Arquivo ${blobPath} deletado com sucesso.`)
    } catch (erro) {
        console.error(`Erro ao deletar ${blobPath}: ${erro.message}`)
    }
}







export async function listarAr(req, res) {
    const models = await getAr();
    return res.status(200).json(models);
}

export async function cadastrarAr(req, res) {
    console.log("ar executado");

    try {
        const filePath = req.body.src;

        if (!filePath) {
            return res.status(400).json({ "Erro": "Caminho do arquivo não enviado" });
        }

        // 🔥 Monta URL pública do arquivo
        const fileUrl = `https://raw.githubusercontent.com/mwd-oficial/backend/main/public/${filePath}`

        console.log("fileUrl:", fileUrl);

        let buffer;

        try {
            // 🔥 Busca o arquivo via HTTP (em vez de fs)
            const response = await fetch(fileUrl);

            if (!response.ok) {
                throw new Error("Erro ao buscar arquivo");
            }

            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);

        } catch (erro) {
            console.error("Erro ao buscar arquivo:", erro);
            return res.status(400).json({ "Erro": "Arquivo não encontrado" });
        }

        // 2️⃣ Lê o buffer usando glTF-transform
        const io = new NodeIO();
        const doc = await io.readBinary(buffer);

        if (req.body.animacao) {
            // 3️⃣ Filtra animações
            const root = doc.getRoot();
            const animations = root.listAnimations();
            animations.forEach(anim => {
                if (anim.getName().toLowerCase() !== req.body.animacao.toLowerCase()) {
                    anim.dispose();
                }
            });
        }

        // 4️⃣ Regrava o modelo filtrado em buffer
        const arrayBuffer = await io.writeBinary(doc);
        const novoBuffer = Buffer.from(arrayBuffer);

        console.log('Arquivo pronto para upload no Vercel Blob!');

        // 5️⃣ Upload para Vercel Blob
        const blobFileName = `${req.body.nome || 'modelo'}-${req.body.timestamp}.glb`;
        const contentType = 'model/gltf-binary';
        const blobUrl = await uploadToVercelBlob(novoBuffer, blobFileName, contentType);

        console.log('Upload finalizado: ', blobUrl);

        // 6️⃣ Salva registro no banco
        await postAr({
            username: req.body.username,
            blobUrl: blobUrl, // Agora armazenamos a URL do Blob
            nomeBlob: blobFileName, // Armazenamos o nome do arquivo no Blob para referência futura
            nome: req.body.nome,
            nomeAnimacao: req.body.nomeAnimacao,
            animacao: req.body.animacao,
            timestamp: req.body.timestamp
        });

        // 7️⃣ Retorna a URL do arquivo no Blob
        return res.status(200).json({
            blobUrl: blobUrl,
        });

    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}
/*
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
            nomeAnimacao: req.body.nomeAnimacao,
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

export async function postarAr(req, res) {
    try {
        await postAr({
            username: req.body.username,
            nome: req.body.nome,
        })
        return res.status(200).send("Modelo estático acessado.");
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}
*/
export async function excluirTodosAr(req, res) {
    try {
        const ar = await getAr();
        ar.forEach(async (modelData) => {
            await deleteAr({ username: modelData.username });
        })
        return res.status(200).send("Todos os AR foram excluídos com sucesso.");
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}