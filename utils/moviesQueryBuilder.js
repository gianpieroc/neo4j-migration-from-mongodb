var fs = require('fs');
module.exports = function (movies, sagas){
    // actors list in order to check if has added before
    const estados = ['Amazonas','DeltaAmacuro', 'Bolivar', 'Zulia', 'Miranda', 'Vargas', 'Monagas','Anzoategui','NuevaEsparta','Falcon','Apure','Cojedes','Merida','Barinas', 'Lara','Guarico','DtoCapital','Carabobo','Aragua']

    let directorList= []
    let sagasList = []
    let clasificationList = []
    let producersList = []
    let typeList =[]
    let movieType = []
    let actorList = []
    let query = ''
    for (let year=2000; year <= 2005; year++){
        query += `CREATE (Y${year}:Year {year:${year}})\n`
    }
    for (let i = 0; i < movies.length; i++) {
        // CREATE NODES BUILDING A QUERY STRING
        let movie = movies[i].toObject()
        // preventing special characters
        let movieCamelCase = movie.nombre.trim().split(/,| |ó|í|á|é|ú|'|:|\.|&|\-/)
        movieCamelCase = movieCamelCase.reduce((elem,ac)=>elem+ac,"M")
        // Movie node Creation
        query += `CREATE (${movieCamelCase}:Movie { nombre: '${movie.nombre.replace('\'','').trim() || ""}',
                    nombre_original:'${movie.nombre_original.replace('\'','').trim() || ""}',
                    clasificacion_IMDB:${movie.clasificacion_IMDB || ""},
                    dinero_recaudado:${movie.dinero_recaudado || ""},
                    duracion:${movie.duracion || ""},
                    nominaciones_y_premios: '${movie.nominaciones_y_premios|| ""}'})\n`

        // CREATE RELATIONSHIP BETWEEN YEAR AND MOVIE
        query += `CREATE (${movieCamelCase})-[:RELEASED_AT]->(Y${movie.año})\n`

        // CREATE MOVIE TYPES NODES AND RELATIONS
        for(let pr=0; pr < movie.genero.length; pr++){
            let type = movie.genero[pr]
            if(!typeList.find((e)=>e.trim() == type)){
                query += `CREATE (${type}:Type {tipo:'${type}'})\n`
                typeList.push(type)
            }
            query += `CREATE (${movieCamelCase})-[:IS_TYPE]->(${type})\n`
        }

        // PRODUCERS
        let producer = movie.filial.trim() || ""
        let producerCamelCase = producer.trim().split(/,| |ó|í|á|é|ú|'|:|\.|&|\-/)
        producerCamelCase = producerCamelCase.reduce((elem,ac)=> elem+ac, "P").trim()
        if(!producersList.find((e)=>e.trim() == producer)){
            query += `CREATE (${producerCamelCase}:Producer {nombre:'${producer.replace('\'','')}'})\n`
            producersList.push(producer)
        }
        query += `CREATE (${movieCamelCase})-[:PRODUCED_BY]->(${producerCamelCase})\n`


        // adding actors and characters nodes and relations
        for(let j=0; j < movie.actores.length; j++){
            let actor = movie.actores[j].trim()
            let actorCamelCase = actor.trim().split(/,| |ó|í|á|é|ú|'|:|\.|&|\-/)
            actorCamelCase = actorCamelCase.reduce((elem,ac)=> elem+ac, "A").trim()
            // find if exists the actor
            if(!actorList.find((e)=>e.trim() == actorCamelCase)){
                query += `CREATE (${actorCamelCase}:Person {nombre:'${actor.replace('\'','')}', name:'${actor.replace('\'','')}'})\n`
                actorList.push(actorCamelCase)
            }
            let characterInfo = movie.personajes[j] || null
            // in case if characterInfo does not exists
            if( characterInfo != null ){
                query += `CREATE (${actorCamelCase})-[:ACTED_IN {nombre:'${characterInfo.nombre.replace('\'','').trim() || ""}', rol:'${characterInfo.rol}'}]->(${movieCamelCase})\n`
            }else{
                query += `CREATE (${actorCamelCase})-[:ACTED_IN]->(${movieCamelCase})\n`
            }
        }

        let director = movie.director
        let directorCamelCase = director.split(/,| |ó|í|á|é|ú|'|:|\.|&|\-/)
        directorCamelCase = directorCamelCase.reduce((elem,ac)=> elem+ac, "").trim()
        if(!directorList.find((e)=>e == directorCamelCase)){
            query += `CREATE (${directorCamelCase}:Director {nombre:'${director.replace('\'','')}'})\n`
            directorList.push(directorCamelCase)
        }
        query += `CREATE (${movieCamelCase})-[:DIRECTED_BY]->(${directorCamelCase})\n`

        // ADDING CLASIFICATION IN MOVIE
        let clasification = movie.clasificacion || ""
        if(!clasificationList.find((e)=>e.trim() == clasification)){
            query += `CREATE (${clasification}:Clasification {nombre:'${clasification}'})\n`
            clasificationList.push(clasification)
        }
        query += `CREATE (${movieCamelCase})-[:CLASS]->(${clasification})\n`


        // SAGAS
        let saga = movie.saga || ""
        let sagaCamelCase = saga.split(/,| |ó|í|á|é|ú|'|:|\.|&|\-/)
        sagaCamelCase = sagaCamelCase.reduce((elem,ac)=> elem+ac, "s").trim()
        if(saga && saga.trim().length > 0){
            if(!sagasList.find((e)=>e.trim() == sagaCamelCase)){
                query += `CREATE (${sagaCamelCase}:Saga {nombre:'${saga.replace('\'','')}'})\n`
                sagasList.push(sagaCamelCase)
            }
            query += `CREATE (${sagaCamelCase})-[:SAGA_OF]->(${movieCamelCase})\n`
        }
    }

    for(let es=0; es< estados.length; es++){
        query += `CREATE (${estados[es]}:Estado {nombre:'${estados[es]}'})\n`
    }

    for(let es=0; es< estados.length; es++){
        const random = Math.round(Math.random()*20)
        if(random !== estados[es]){
            query+= `CREATE (${estados[es]})-[:ADYACENT {distance:${Math.round(Math.random()*100)}}]->(${estados[random]})\n`
        }else{
           es--
        }
    }

    for(let fi=0; fi<producersList.length; fi++){
        let producerCamelCase = producersList[fi].trim().split(/,| |ó|í|á|é|ú|'|:|\.|&|\-/)
        producerCamelCase = producerCamelCase.reduce((elem,ac)=> elem+ac, "P").trim()
        query+= `CREATE (${producerCamelCase})-[:LOCATED]->(${estados[fi]})\n`
    }

    fs.writeFile("./queryResult", query, function(err) {
        if(err) return console.log(err) 
        console.log("The file was saved!");
    });

    return query
}
