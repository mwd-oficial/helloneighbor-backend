import express from "express";
import cors from "cors";
import { listarAr, cadastrarAr, excluirTodosAr } from "../controllers/controller.js";
import excluirAr from "../programado.js"

const corsOptions = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    optionsSuccessStatus: 200
}

export function routes(app) {
    app.use(express.json())
    app.use(cors(corsOptions));
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    app.get("/ar", listarAr)
    app.post("/ar/cadastrar", cadastrarAr)
    app.get("/ar/excluir", excluirAr)
    //app.get("/ar/excluirTodos", excluirTodosAr);
}