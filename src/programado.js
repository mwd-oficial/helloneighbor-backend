import { getAr } from "../src/models/model.js";
import { deleteFile } from "../src/controllers/controller.js";

export default async function excluirAr(req, res) {
    const agora = new Date()
    const modelosAr = await getAr()

    const expirados = modelosAr.filter(model => {
        const timestamp = new Date(model.timestamp)
        const expiracao = new Date(timestamp.getTime() + 30 * 60 * 1000)
        return expiracao <= agora
    })

    for (const model of expirados) {
        try {
            await deleteFile(model.nomeBlob)
            console.log(`modelo ${model.nomeBlob} deletado.`)
        } catch (err) {
            console.error(`Erro ao deletar ${model.nomeBlob}: ${err.message}`)
        }
    }

    res.status(200).send("Verificação e exclusão concluídas.")
}
