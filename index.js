const express = require('express')
const fs = require('fs');
const https = require('https');
const bodyparser = require('body-parser')
const app = express()
const port = 3000
const sql = require('mssql')
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

var options = {
    key: fs.readFileSync('./certificado/PrivateKey.key'),
    cert: fs.readFileSync('./certificado/apoya2_org.crt'),
    ca: [
        fs.readFileSync('./certificado/apoya2_org.ca-bundle'),
        fs.readFileSync('./certificado/apoya2_org.p7b')
    ]
};

// Cada vez que realicen una peticion al WebHook con el path /webhookagro Iniciara este proceso
app.post('/webhookagro', (req, res) => {
    try {
        console.log('Bienvenido al WebHook-AgroApoya2 \n')
        //Recuperamos valores del body enviados por el tercero que llamo al webhook
        var body = req.body;
        var bodystring = JSON.stringify(body);
        var status = body.idstatus
        var persona = body.idperson
        //Instanciamos conexion a base de datos
        //Propiedad: encrypt tiene que estar en false a menos que nos conectemos a AZURE
        //Propiedad: trustServerCertificate debe estar true para que el proceso permita conexion sin necesidad de certificado SSL
        const pool = sql.connect({
            user: 'Cdi 2017',
            password: 'Cdi.2017*',
            server: '34.215.136.170',
            database: 'Agroapoya2Prod',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                requestTimeout: 60000
            }

        }).then(ValConCorrecta => {
            let fecha = new Date();
            //En caso de que se logre la conexion se realiza el siguiente proceso           

            console.log('Conexión BD creada ' + fecha.toLocaleString() + '\n');
            var QueryI = "Insert into Trans_Pago_Agro (id,Ammount,Externalorder,IPP,Fullname,Idstatus,NombreStatus,IdPersona,Firstname,Lastname,Identification,Email,Phone,Bodyrequest,FechaRegistro) values('" + body.id + "','" + body.amount + "','" + body.externalorder + "','" + body.ip + "','" + body.fullname + "','" + status.id + "','" + status.nombre + "','" + persona.id + "','" + persona.firstname + "','" + persona.lastname + "','" + persona.identification + "','" + persona.email + "','" + persona.phone + "','" + bodystring + "','" + fecha.toLocaleString() + "')";
            const Insercion = sql.query(QueryI).then(valInsert => {
                //Posterior al realizar la insercion, si esta se realizo correctamente cerramos nuestra conexion a la BD, esto para evitar hilos no controlados
                ValConCorrecta.close();
                console.log('Transacción realizada, transacción:', body.id + ' ' + persona.firstname + ' ' + persona.lastname + ' - ' + persona.identification + ' - ' + status.nombre + '\n')
                console.log('Conexión BD finalizada ' + fecha.toLocaleString() + '\n')
                //Retornamos respuesta de proceso realizado correctamente
                res.send({
                    resultado: '200'
                })
            }, ValNoInsert => {
                //En caso de presentarse error en la insercion se realiza el siguiente proceso
                console.log('Transacción no insertada, transacción:', body.id + ' ' + persona.firstname + ' ' + persona.lastname + ' - ' + persona.identification + ' - ' + status.nombre + '\n')
                console.log(ValNoInsert.originalError.info)
                //Igualmente retornamos respuesta para finalizar el hilo, si no finalizamos quedara siempre EN PROCESO y se toteara por timeout afectando al servidor
                res.send({
                    resultado: '500'
                })
            })
        }, ValConErrada => {
            //En caso de que no se logre la conexion a BD se realiza el siguiente proceso
            console.log('Conexión BD no creada, se presentaron errores transacción:', body.id + ' ' + persona.firstname + ' ' + persona.lastname + ' - ' + persona.identification + '\n')
            console.log(ValConErrada.originalError)
            //Igualmente retornamos respuesta para finalizar con el hilo, si no finalizamos quedara siempre EN PROCESO y se toteara por timeout afectando al servidor
            res.send({
                resultado: '500'
            })
        })
    } catch (error) {
        console.error("ERROR TRY: " + error);
        res.status(500).send({ resultado: '500' });
    }
})

// Se inicializa el WebHook para que siempre este escuchando en el puerto especificado en la variable port, validar regla de entrada en el firewall (debe estar creada con el mismo puerto)
https.createServer(options, app).listen(port, () => {
    console.log('Webhook corriendo en el puerto ' + port + "\n")
});


