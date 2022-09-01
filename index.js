const express = require('express')
const bodyparser = require('body-parser')
const app = express()
const port = process.env.port || 3000
const sql = require('mssql')
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

app.listen(port, () => {
    console.log('Servicio corriendo en el puerto ' + port)
})

app.get('/webhookagro', (req, res) => {
    // res.send({ message: 'Hola mundo' })
    const pool = sql.connect(
        {
            user: 'Cdi 2017',
            password: 'Cdi.2017*',
            server: '34.215.136.170',
            database: 'AgroApoya2',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        }
    ).then(val => {
        const consulta = sql.query('Select * from AGRO_FORMA_PAGO').then(val =>{
            console.log(val);
        })        
    })
    

    // sql.query('Select 1').then(val => {
    //     console.log(val)
    // })


    // sql.connect(config, err => { 
    //     if(err){
    //         console.log(err);
    //     }
    //     console.log("Connection Successful !");

    //     new sql.Request().query('select 1 as number', (err, result) => {            
    //         console.dir(result)            
    //     })

    // });

    sql.on('error', err => {        
        console.log("Sql database connection error: " ,err);
    })
})

