const neo4j = require('neo4j-driver').v1;
const path = require('path');
const mongoose = require('mongoose');
const chalk = require('chalk');
const moviesQueryBuilder = require('./utils/moviesQueryBuilder');

global.Promise = require('bluebird');

// URLS to connect
const MONGODB_URI = 'mongodb://localhost:27017/disney-movies-2000-20005'
const NEO4J_URI = 'bolt://localhost'

// credentials for neo4j, username and password respectively
const neo4jCredentials = ['neo4j','neo4j']

// Error handling
Promise.onPossiblyUnhandledRejection((e, promise) => {
    throw e
})

// connecting to mongodb
mongoose.connect(MONGODB_URI)
mongoose.promise = Promise

// import models
require('./models/Movie');
require('./models/Saga');

// import queries
// const mongodbQueries = require('./queries/mongodb');
const Movie = mongoose.model('Movie');
const Saga = mongoose.model('Saga');

// Getting schema files
const neo4jDriver = neo4j.driver("bolt://localhost", neo4j.auth.basic('neo4j','admin'));

global.session = neo4jDriver.session()


console.log(chalk.cyanBright(`Connected with both Databases.. \n\n`)) 
async function migrate(){
    const moviesQuery = await Movie.find({})
    const sagaQuery = await Saga.find({})

    return moviesQueryBuilder(moviesQuery,sagaQuery)

}


async function migration () {

    // first we gonna clean up db
    console.log(chalk.cyanBright(`Cleaning Neo4jDatabase`))
    session.run(`MATCH (n)
        OPTIONAL MATCH (n)-[r]-()
        DELETE n,r`)
        .subscribe({
            onNext: (record)=> record
        });
    console.log(chalk.cyanBright(`Building query...`))

    // INSERT TO DATABASE
    const query = await migrate()
    console.log(chalk.cyanBright(`Querying...`))
    await session.run(query)
        .subscribe({
            onCompleted: (e) => console.log(chalk.green('Created db')),
            onError: (c)=> console.log(c)
        });

    // PREGUNTAS PROYECTO 1
     await session.run(`MATCH(Director {nombre:'Jim Cummings'})-[]-(Movie) RETURN count(*) as count`)
     .subscribe({
         onNext: function (record) {
            console.log(chalk.cyanBright(`\nPRIMERA PREGUNTA: CANTIDAD DE PELICULAS DADO UN DIRECTOR`))
            console.log(chalk.green(`MATCH(Director {nombre:'Jim Cummings'})-[]-(Movie) RETURN count(*) as count`))
            console.log('RESULTADO:\n')
             console.log(record.get('count').low)
         },
     })

    console.log(chalk.cyanBright(`\nSEGUNTA PREGUNTA: MOstrar peliculas dado uno o mas generos`))
    console.log(chalk.green(`MATCH(m:Movie)-[]-(t:Type) WHERE t.tipo="Comedia" OR t.tipo="Animacion" RETURN m.nombre as nombre`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH(m:Movie)-[]-(t:Type) WHERE t.tipo="Comedia"  OR t.tipo="Animacion" RETURN m.nombre as nombre`)
        .subscribe({
            onNext: function (record) {
                console.log(record.get('nombre'))
            },
            onCompleted: (e) => e
        })

    console.log(chalk.cyanBright(`\nTERCERA PREGUNTA: DADO UN RANGO, MOSTRAR PELICULAS SEGUN ESE RANGO SEGUN IMDB`))
    console.log(chalk.green(`MATCH(m:Movie) WHERE m.clasificacion_IMDB > 3 AND m.clasificacion_IMDB < 4 return m.nombre as nombre`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH(m:Movie) WHERE m.clasificacion_IMDB > 3 return m.nombre as nombre`)
        .subscribe({
            onNext: function (record) {
                console.log(chalk.blue(record.get('nombre')))
            },
            onCompleted: (e) => e
        })

    console.log(chalk.cyanBright(`\nCUARTA PREGUNTA: Ordenar de manera ascendente los directores y la cantidad de dinero recaudado según sus películas dirigidas`))
    console.log(chalk.green(`MATCH(d:Director)-[]-(m:Movie) RETURN d.nombre as director_name, m.nombre as nombre_pelicula, m.dinero_recaudado as dinero_rec ORDER BY m.dinero_recaudado  DESC`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH(d:Director)-[]-(m:Movie) RETURN d.nombre as director_name, m.nombre as nombre_pelicula, m.dinero_recaudado as dinero_rec ORDER BY m.dinero_recaudado  DESC`)
        .subscribe({
            onNext: function (record) {
                console.log(chalk.red(record.get('nombre_pelicula'))+" "+ chalk.blue(record.get('director_name'))+" " + chalk.white(record.get('dinero_rec')))},
            onCompleted: (e) => e
        })


    console.log(chalk.cyanBright(`\nQUINTA PREGUNTA: Dado un año YYYY mostrar las películas estrenadas ese año`))
    console.log(chalk.green(`MATCH (y:Year)-[]-(m:Movie) WHERE y.year=2001 return m.nombre as nombre`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH (y:Year)-[]-(m:Movie) WHERE y.year=2001 return m.nombre as nombre`)
        .subscribe({
            onNext: function (record) {
                console.log(chalk.magenta(record.get('nombre')))},
            onCompleted: (e) => e
        })


    console.log(chalk.cyanBright(`\nSEXTA PREGUNTA: De existir una saga. Mostrar las películas asociadas.`))
    console.log(chalk.green(`MATCH (s:Saga)-[]-(m:Movie) return m.nombre as nombre_peli, s.nombre as nombre ORDER BY nombre`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH (s:Saga)-[]-(m:Movie) return m.nombre as nombre_peli, s.nombre as nombre ORDER BY nombre`)
        .subscribe({
            onNext: function (record) {
                console.log(chalk.white(record.get('nombre'))+" " + chalk.cyan(record.get('nombre_peli')))},
            onCompleted: (e) => e
        })

    console.log(chalk.cyanBright(`\nSEPTIMA PREGUNTA: Mostrar el año con mayores fondos recaudados.`))
    console.log(chalk.green(`MATCH (m:Movie) return m.nombre as nombre, m.dinero_recaudado as dinero_rec ORDER BY dinero_rec DESC LIMIT 1`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH (m:Movie) return m.nombre as nombre, m.dinero_recaudado as dinero_rec ORDER BY dinero_rec DESC LIMIT 1`)
        .subscribe({
            onNext: function (record) {
                console.log(chalk.magenta(record.get('nombre'))+" " + chalk.blue(record.get('dinero_rec')))},
            onCompleted: (e) => e
        })


    console.log(chalk.cyanBright(`\nSEPTIMA PREGUNTA:Dado un año mostrar la película con mayor duración de ese
        año.`))
    console.log(chalk.green(`MATCH (y:Year)-[]-(m:Movie) WHERE y.year=2005 return m.nombre as nombre, m.duracion as duracion ORDER BY duracion DESC LIMIT 1`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH (y:Year)-[]-(m:Movie) WHERE y.year=2005 return m.nombre as nombre, m.duracion as duracion ORDER BY duracion DESC LIMIT 1`)
        .subscribe({
            onNext: function (record) {
                console.log(chalk.yellow(record.get('nombre'))+" " + chalk.bgRed(record.get('duracion')))},
            onCompleted: (e) => e
        })


    // PROYECTO 2 PREGUNTAS
    console.log(chalk.cyanBright(`\nPRIMERA PREGUNTA: MOstrar peliculas dado uno o mas generos`))
    console.log(chalk.green(`MATCH(m:Movie)-[]-(t:Type) WHERE t.tipo="Comedia" RETURN m.nombre as nombre`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH(m:Movie)-[]-(t:Type) WHERE t.tipo="Infantil" RETURN m.nombre as nombre`)
        .subscribe({
            onNext: function (record) {
                console.log(chalk.bgBlue(record.get('nombre')))
            },
            onCompleted: (e) => e
        })
    console.log(chalk.cyanBright(`\nSEGUNTA PREGUNTA:Mostrar película con mayor duración dada una clasificación.`))
    console.log(chalk.green(`MATCH (c:Clasification)-[]-(m:Movie) WHERE c.nombre="A" return m.nombre as nombre, m.duracion as duracion ORDER BY duracion DESC LIMIT 1`))
    console.log('RESULTADO:\n')
    await session.run(`MATCH (c:Clasification)-[]-(m:Movie) WHERE c.nombre="A" return m.nombre as nombre, m.duracion as duracion ORDER BY duracion DESC LIMIT 1`)
        .subscribe({
            onNext: function (record) {
                console.log(chalk.bgMagenta(record.get('nombre'))+" " + chalk.red(record.get('duracion')))
            },
            onCompleted: (e) => e
        })

}

migration()

// const resultPromise = session.run('neo4j Query');

// resultPromise.then(result => {
//     session.close();

//     const singleRecord = result.records[0];
//     const node = singleRecord.get(0);

//     console.log(node.properties.name);

//     // on application exit:
//     driver.close();
// });

// console.log(chalk.cyan(`Closing neo4j Session`))
// session.close()

// console.log(chalk.cyanBright(`Closing mongodb Session`))
// mongoose.disconnect()
