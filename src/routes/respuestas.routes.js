import { Router} from "express";
const router = Router();
import registroEncuesta from "../models/encuesta";
import Respuesta from "../models/respuesta";

// Rutas Modulo 5
router.get("/", async (req, res) => {
	let encuestas = await registroEncuesta.find().select("_id").select("nomEncuesta").lean();

	res.render('respuestas/index', {
		layout: "dashboard",
		datos: encuestas
	});
});

router.get("/:id", async (req, res) => {
	const {id} = req.params;
	
	let encuesta = await registroEncuesta.findById({_id: id}).populate({
		path: "secciones",
		populate: {
			path: "preguntas"
		}
	}).lean();

	let respuestas = await Respuesta.find({idEncuesta: id}).populate({
		path: "idEncuesta"
	}).populate({path: "preguntas.idPregunta", select: ["_id", "tipoR"]}).lean();

	console.log(encuesta, respuestas);
	let respuestasProcesadas = respuestas.map(respuesta => {
		return respuesta.preguntas.map(pregunta => {
			if(pregunta.idPregunta.tipoR == "opcion-unica" || pregunta.idPregunta.tipoR == "opcion-multiple"){
				return Object.fromEntries(new Map([
					[pregunta.idPregunta._id.toString(), pregunta.respuestas]
				]));
			}
		});
	});
	
	let respuestasMapeadas = respuestasProcesadas.reduce((pre, current, index) => {
		let valor, llave;
		for(let i = 0; i < current.length; i++) {
			valor = Object.values(current[i]);
			llave = Object.keys(current[i]);
			if(pre[llave] == undefined) {
				pre[llave] = valor;
			}else {
				pre[llave] = pre[llave].concat(valor);
			}
		}
		return pre;
	}, {});
	let datos = {};
	let resVal, resKey;
	resVal = Object.values(respuestasMapeadas);
	resKey = Object.keys(respuestasMapeadas);
	for(let i = 0; i < resKey.length; i++) {
		datos[resKey[i]] = resVal[i].reduce((prev, c) => prev.concat(c));
	}

	res.render("respuestas/show", {
		layout:"Dashboard",
		datos: encuesta
	});
});

export default router;