const express = require("express")
const app = express()
const handlebars = require("express-handlebars").engine
const bodyParser = require("body-parser")
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')

const serviceAccount = require('./projetoweb-nodejs-firebase-adminsdk-73vfg-9318203980.json')

initializeApp({
    credential: cert(serviceAccount)
})

const db = getFirestore()
const agendamentosRef = db.collection('agendamentos');

app.engine("handlebars", handlebars({ defaultLayout: "main" }))
app.set("view engine", "handlebars")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get("/", function (req, res) {
    res.render("primeira_pagina")
})

app.get("/consulta", function (req, res) {
    agendamentosRef.get().then(snapshot => {
        const agendamentos = [];
        snapshot.forEach(doc => {
            const agendamento = doc.data();
            agendamento.id = doc.id; // Adiciona o ID do documento ao objeto agendamento
            agendamentos.push(agendamento);
        });
        res.render('consulta', { agendamentos });
    })
    .catch(error => {
        console.log('Erro ao carregar dados do banco: ', error);
        res.status(500).send('Erro ao carregar dados do banco.');
    });
});


app.get("/editar/:id", function (req, res) {
    const id = req.params.id;
    console.log("ID do documento:", id);

    agendamentosRef
        .doc(id)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                res.status(404).send("Documento não encontrado");
                return;
            }

            const agendamento = doc.data();
            agendamento.id = doc.id; // Adiciona o ID do documento ao objeto agendamento
            res.render("editar", { agendamento });
        })
        .catch((error) => {
            console.log("Erro ao carregar dados do banco: ", error);
            res.status(500).send("Erro ao carregar dados do banco.");
        });
});

app.get("/excluir/:id", function (req, res) {
    const id = req.params.id;

    agendamentosRef
        .doc(id)
        .delete()
        .then(() => {
            console.log("Agendamento removido, ID:", id);
            res.redirect("/consulta");
        })
        .catch((error) => {
            console.log("Erro ao excluir agendamento:", error);
            res.status(500).send("Erro ao excluir agendamento.");
        });
});

app.post("/cadastrar", function (req, res) {
    var result = db.collection('agendamentos').add({
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    }).then(function () {
        console.log('Added document');
        res.redirect('/')
    })
})

app.post("/atualizar", function (req, res) {
    const id = req.body.id;
    agendamentosRef.doc(id).update({
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    })
        .then(() => {
            console.log('Documento atualizado');
            res.redirect('/consulta'); // Redirecione para a página de consulta após a atualização
        })
        .catch(error => {
            console.log('Erro ao atualizar documento: ', error);
            res.status(500).send('Erro ao atualizar documento.');
        });
})

app.listen(8081, function () {
    console.log("Servidor ativo!")
})