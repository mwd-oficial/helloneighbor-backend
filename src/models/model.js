import { ObjectId } from "mongodb";
import conectarAoBanco from "../config/dbConfig.js";

const conexao = await conectarAoBanco(process.env.STRING_CONEXAO);

const db = conexao.db("helloneighbor");
const colecaoAr = db.collection("ar");

export async function getAr() {
    return await colecaoAr.find().toArray();
}

export async function postAr(modelData) {
    await colecaoAr.insertOne(modelData);
}

export async function deleteAr(modelData) {
    return await colecaoAr.deleteOne(modelData);
}