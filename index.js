const express = require('express')
const bodyparser = require('body-parser')
const app = express()
const port = process.env.port || 3000
const sql = require('mssql')
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

// Se inicializa el WebHook para que siempre este escuchando en el puerto especificado en la linea 4, validar regla de entrada en el firewall (debe estar creada con el mismo puerto)
app.listen(port, () => {
    console.log('Webhook corriendo en el puerto ' + port)
})

// Cada vez que realicen una peticion al WebHook con el path /webhookagro Iniciara este proceso
app.get('/webhookagro', (req, res) => {
    console.log('Bienvenido al WebHook-AgroApoya2')
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
        database: 'AgroApoya2',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    }).then(ValConCorrecta => {
        //En caso de que se logre la conexion se realiza el siguiente proceso
        console.log('Conexión BD creada')
        const Insercion = sql.query("Insert into Trans_Pago_Agro values('" + body.id + "','" + body.ammount + "','" + body.externalorder + "','" + body.ip + "','" + body.fullname + "','" + body.additionaldata + "'" +
            ",'" + status.id + "','" + status.nombre + "','" + persona.id + "','" + persona.firstname + "','" + persona.lastname + "','" + persona.identification + "','" + persona.email + "','" + persona.phone + "','" + body.paymentmethod + "','" + body.nombre + "','" + bodystring + "')").then(valInsert => {
            //Posterior al realizar la insercion, si esta se realizo correctamente cerramos nuestra conexion a la BD, esto para evitar hilos no controlados
            ValConCorrecta.close();
            console.log('Transacción realizada')
            console.log('Conexión BD finalizada')
                //Retornamos respuesta de proceso realizado correctamente
            res.send({
                resultado: 'Transacción realizada'
            })
        }, ValNoInsert => {
            //En caso de presentarse error en la insercion se realiza el siguiente proceso
            console.log('Transacción no insertada')
            console.log(ValNoInsert)
                //Igualmente retornamos respuesta para finalizar el hilo, si no finalizamos quedara siempre EN PROCESO y se toteara por timeout afectando al servidor
            res.send({
                resultado: 'Transacción no realizada, validar error en valores del body'
            })
        })
    }, ValConErrada => {
        //En caso de que no se logre la conexion a BD se realiza el siguiente proceso
        console.log('Conexión BD no creada, se presentaron errores \n')
        console.log(ValConErrada)
            //Igualmente retornamos respuesta para finalizar con el hilo, si no finalizamos quedara siempre EN PROCESO y se toteara por timeout afectando al servidor
        res.send({
            resultado: 'Conexión BD no creada, se presentaron errores'
        })
    })
})