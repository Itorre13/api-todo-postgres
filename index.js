require("dotenv").config();

const express = require("express");
const cors = require("cors");
const {leerTareas,nuevaTarea,borrarTarea,actualizarEstado,actualizarTexto} = require("./database"); // como es js no necesita la extensión

const servidor = express(); // creamos servidor con express

//middlewares

servidor.use(cors());

servidor.use(express.json()); // este .json intercepta cualquier información que le llega y lo convierte a objeto y lo almacena en petición.body.(objeto body de la petición) Es de la familia del urlencoded

if(process.env.PRUEBAS){
    servidor.use("/pruebas",express.static("./pruebas")); // creamos un site estático para poder trastera y hacer pruebas. Le hemos dicho a git que ignore este fichero para que no se vea. Primero creamos la URL /pruebas y luego la carpeta ./pruebas -> tienen el mismo nombre pero son diferentes
}

servidor.get("/tareas", async (peticion,respuesta) => { // si llega una petición con el metodo get este es el callback que se encarga de responder
    try{
        let tareas = await leerTareas(); // leemos las tareas de la base de datos. Que podemos hacerlo porque las hemos importado arriba en este código con require

        respuesta.json(tareas); // las enviamos como json a quien haya hecho la petición

    }catch(error){ // si no podemos enviarla por algún error
        respuesta.status(500);
        respuesta.json({ error : "error en el servidor" });
    }
});

servidor.post("/tareas/nueva", async (peticion,respuesta,siguiente) => { // si la peticion que nos llega es con POST a esta URL. Tendremos que verificar que tarea exista y que no esté vacía. Si es así crearemos la tarea y responderemos a quien haya hecho la petición con el id. Si algo ha enviado mal lo vamos a enviar a error en la petición. Como desde este middleware vamos a querer comuncarnos con el middleware del error, necesitaremos tb 'siguiente'

    let {tarea} = peticion.body;

    if(tarea && tarea.trim() != ""){ // si existe la tarea y tarea.trim, xa poderle quitar los espacios q tenga, es distinto de vacío algo voy a hacer
        try{
            let id = await nuevaTarea(tarea);

            respuesta.status(201);
            return respuesta.json({id})
        }catch(error){
            respuesta.status(500);
            return respuesta.json({ error : "error en el servidor"});
        }
    }

    siguiente({ error : "no tiene la propiedad TAREA" }); // si no llegue al return todo OK por lo que sea invocamos siguiente. Si a siguiente le pasamos cualquier cosa como argumento inmeditamente este siguiente no apunta al siguiente middleware si no al middleware del error. Y esto que enviamos entre paréntesis aterriza en el error de la función siguiente.
    
});

servidor.put("/tareas/actualizar/:operacion(1|2)/:id([0-9]+)",async (peticion,respuesta,siguiente) => {
    let operaciones = [actualizarTexto,actualizarEstado];

    let {id,operacion} = peticion.params;

    operacion = Number(operacion); // para dejar claro que operacion va a ser un número en nuestro código. Será 1 o 2. Esto lo que hacer es coger el string y lo convierte en número.

    let {tarea} = peticion.body;

    if(operacion == 1 && (!tarea || tarea.trim() == "")){ // si es 1 y o no me han pasado la tarea o la tarea está vacía quiero mandarlo al error.
        return siguiente({ error : "no tiene la propiedad TAREA" });
    }
    try{

        let cantidad = await operaciones[operacion - 1](id, operacion == 1 ? tarea : null);

        respuesta.json({ resultado : cantidad ? "ok" : "ko" });

    }catch(error){
        respuesta.status(500);
        respuesta.json({ error : "error en el servidor"});
    }
    
});

servidor.delete("/tareas/borrar/:id([0-9]+)",async (peticion,respuesta) => {
    try{
        let cantidad = await borrarTarea(peticion.params.id);

        respuesta.json({ resultado : cantidad ? "ok" : "ko" });
    }catch(error){
        respuesta.status(500);
        respuesta.json({ error : "error en el servidor"});
    }
});

servidor.use((error,peticion,respuesta,siguiente) => { // necesita los cuatro a pesar de que vayamos a utilizar solo el error y la respuesta. Los necesita porque sino el no puede identificar que necesita cuatro cosas
    respuesta.status(400); // decirle a la respuesta que su status es 400
    respuesta.json({ error : "error en la petición" }); // a través de esa respueta en json responde con error en la petición
});

servidor.use((peticion,respuesta) => {
    respuesta.status(404);
    respuesta.json({ error : "recurso no encontrado" });
});

servidor.listen(process.env.PORT);