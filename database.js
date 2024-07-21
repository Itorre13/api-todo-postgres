require("dotenv").config();
const postgres = require("postgres"); // no se refiere a postgres como servidor de base de datos sino a lo que vamos a utilizar de js para conectarnos a postgres

function conectar(){ // invocar el módulo postgress con mis datos. Utilizamos variables de entorno para no comprometer los datos sensibles
    return postgres({
        host : process.env.DB_HOST, // donde está
        database : process.env.DB_NAME, // que base de datos quiero
        user : process.env.DB_USER, // cual es el usuario
        password : process.env.DB_PASSWORD // cual es la contraseña
    });
}

function leerTareas(){ 
    return new Promise(async (ok,ko) => { // retorna una promesa con el resultado de hacer la consulta a la base de datos
        const conexion = conectar();
        try{
            let tareas = await conexion`SELECT * FROM tareas`; // variable q consulta a la base de datos, y se 'trae' todas las tareas que haya

            conexion.end(); // cierra la conexión

            ok(tareas); // la retorna

        }catch(error){
            ko({ error : "error en base de datos" }); // si algo falla nos manda este mensaje
        }
    });
}

/*

leerTareas()
.then( x => console.log(x)) // x será las tareas
.catch( x => console.log(x)) // x será el mensaje de error

// esto sería una prueba unitaria. Una vez ya está probada y funciona sabemos que está lista -- TDD técnica de programación que utiliza funciones para probar
*/

function nuevaTarea(tarea){
    return new Promise(async (ok,ko) => { // retorna una promesa
        const conexion = conectar(); // invoca la función conectar para traer la conexión
        try{
            let [{id}] = await conexion`INSERT INTO tareas (tarea) VALUES (${tarea}) RETURNING id`;

            conexion.end();

            ok(id);

        }catch(error){
            ko({ error : "error en base de datos" });
        }
    });
}

/*
nuevaTarea("otra tarea") // crea una nueva tarea que pondremos entre paréntesis ()
.then( x => console.log(x)) // x será la nueva tarea
.catch( x => console.log(x)) // x será el mensaje de error
*/

module.exports = {leerTareas,nuevaTarea} // con esta función las estamos exportando. Donde sea que metamos con require este fichero podremos usar estas funciones.
