
//---------Requerimientos bot----------------------//
const { Client, MessageMedia } = require('whatsapp-web.js');
const fs=require('fs');
const fsp = require('fs').promises;
const SESSION_FILE_PATH = './session.json';
const qrcode = require('qrcode-terminal');
const ExcelJS = require('exceljs');
const pathExcel = `./Excel/contactos.xlsx`;
let client;
let sessionData;
//-------------------------------------------------//

/**
 *Escuchando Wps
 */
const listenMessage=()=> {
  console.log("Escuchando Whatssaps..")

  client.on('message', async msg => {
    const { from, to, body,author} = msg;
    //msg.author cuando el wp viene de un grupo ----- msg.from cuando es de un wp comun 
    author!==undefined ?  addNumeroWhatssap(author.replace('@c.us', '').substr(0,13)) : addNumeroWhatssap(from.replace('@c.us', '').substr(0,13)); 


    if (msg.hasMedia) {//Solo archivos media
      const media = await msg.downloadMedia();

      await SaveAudio(media,msg).then(res=>{ 
        if(res==true){
          sendMessage(from,'*_Gracias! transmitiremos tu audio a la brevedad!_* 🔊🎶🎶');
          
        }
        
      })

    }
    else{
      console.log(msg.body)
      await replyAsk(from, body); // respuestas simples
      
    }
      
  });    
}




/**
 * Guardamos Audios
 * @param {*} media 
 * @param {*} nameAudio
 */


const SaveAudio = (media,msg) => new Promise((resolve, reject) =>{
  const mimetype=media.mimetype.toString()
  if (mimetype =='audio/ogg; codecs=opus'){
    const from=msg.from.replace('@c.us', ''); 
    const id=msg.id.id
    

  
    fs.writeFile(`./media/Audios/${from}-${id}.ogg`, media.data, { encoding: 'base64' }, function (err) {   
      if (err)
        console.log("Error al guardar Audio");
      else
        console.log('Audio Guardado');
        resolve(true)
    });
   
  }
  else{
    console.log("No es un archivo de audio");
    
  }
  
})
  


/**
  * @param {*}numeroWp
 */

 function addNumeroWhatssap(numeroWp) {
  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(pathExcel)) {
      /**
       * Si existe el archivo de contactos lo actualizamos
       */
      workbook.xlsx.readFile(pathExcel)
          .then(() => {
              const worksheet = workbook.getWorksheet(1);
              const lastRow = worksheet.lastRow;

              //busca en exel si ya existe el numero de wp
              let repetido = false;
              for (var i = 2; i <= lastRow.number; i++) {
                  if (worksheet.getRow(i).getCell('A').value == numeroWp) {
                      repetido = true;
                      break;
                  }
              }
              if (repetido === false) {//si no existe lo añade
                  var getRowInsert = worksheet.getRow(++(lastRow.number));
                  getRowInsert.getCell('A').value = numeroWp;
                  getRowInsert.commit();
                  workbook.xlsx.writeFile(pathExcel);
                  console.log("Numero Nuevo!");
              } else {
                  //console.log("Este numero esta Añadido")
              }
          });

      } 
  else {
      /**
       * NO existe el archivo de contactos lo creamos
       */
      
      const worksheet = workbook.addWorksheet('Excel');
      worksheet.columns = [
          { header: 'Contactos', key: 'contactos_key' },
      ];
      worksheet.addRow([numeroWp]);
      workbook.xlsx.writeFile(pathExcel)
      .then(() => {

          console.log("Archivo  Excel de contactos creado!");
      })
      .catch((err) => {
          console.log("Error al crear Archivo Excel contactos", err);
      });
  }

}






/**
 * Guardamos archivos Imagenes jp o png ...
 * @param {*} media 
 * @param {*} nameImg

const SaveImg = (media,msg) => new Promise((resolve, reject) =>{

  const mimetype=media.mimetype
  if ( mimetype=='image/jpeg'|| mimetype== 'image/png'){
    const from=msg.from.replace('@c.us', ''); 
    const id=msg.id.id
    const extensionProcess = mimeDb[media.mimetype]
    const ext = extensionProcess.extensions[0]

    fs.writeFile(`./media/Images/${from}-${id}.${ext}`, media.data, { encoding: 'base64' },function (err) {   
      if (err){
        reject(console.log("Error al guardar la imagen"));
      }
      else{
        console.log("Imagen guardada con exito")
        
      }
      
      
    });
  }
  else{
    reject(console.log("No es un Archivo de Imagen"));
  }
  resolve(true)
})
**/ 




/**
 * Enviamos wp simples
 * @param {*} number 
 */
 const sendMessage = (number = null, text = null) => {
  number = number.replace('@c.us', '');
  number = `${number}@c.us`
  const message = text 
  client.sendMessage(number, message);
  console.log(`Enviando mensaje a..${number}`)
}



/**
 * Enviamos archivos multimedia 
 * @param {*} number 
 * @param {*} fileName 
 */
 const sendMedia = (number, fileName) => {
  number = number.replace('@c.us', '');
  number = `${number}@c.us`
  const media = MessageMedia.fromFilePath(`./mediaSend/${fileName}`);
  client.sendMessage(number, media);
}



/**
 * Respuestas simples
 */
 const replyAsk = (from, answer) => new Promise((resolve, reject) => {
  answer=answer.toLowerCase()
  if (answer == 'no') {
      sendMessage(from, '*_Ok. Quizas luego..._* 🙉');
      resolve();
      return
  }
  if (answer == 'hola'){
    sendMedia(from, 'radio.png')

  const array = [
    '👋 👋 *_Hola te Comunicaste con Radio Toing_*',
    '*_Quieres dejarnos un audio?_* 👅',         
  ].join(' ')

  sendMessage(from,array)
  
    resolve();
    return
  }
   
  if (answer == 'si'){
    sendMessage(from, '*_Buenisimo te escucho_* 👂👌')
    resolve();
    return
  }

  if (answer == 'chau'){
    sendMessage(from, '*_Hasta Luego_* 👋')
    resolve();
    return
  }

  if (answer == 'gracias'){
    sendMessage(from, '*_De nada =)_* 👌')
    resolve();
    return
  }
  sendMessage(from, '*_Te estamos escuchando , Quieres dejarnos un audio?_* 🎤📻')  
  

})




/**
 * Eliminamos archivo Session : para cuando se vencio o hay errores al cargarla.
 */
const deleteSession = () =>{
  
  fsp.unlink(SESSION_FILE_PATH)
  .then(() => {
    console.log('Session Eliminada')
  }).catch(err => {
    console.log('Error al eliminar')
  })


}




/**
 *SI HAY SESSION : cargamos la session
 */
const withSession = () => {
  
  sessionData = require(SESSION_FILE_PATH);
  client = new Client({
      session: sessionData
      
  },
  console.log("Cliente listo esperando a Whatssap! ..."));

  client.on('ready', () => {

      console.log('Conexion lista!');

      connectionReady();

  });

  client.on('auth_failure', () => {
    deleteSession();
    withOutSession();
  })

  client.initialize();
}

/**
 *SI NO HAY SESSION : dibujamos QR 
 */
 const withOutSession = () => {

  console.log('No tenemos session');
  client = new Client();

  //obtiene QR desde api y guarda    
  client.on('qr', (qr) => {
    
    console.log("Generando QR...\n") 

    qrcode.generate(qr, { small: true });//-->dibuja qr en consola
    console.log ("\n Vincule su Whatssap escaneando el codigo QR")
       
  });
  
  client.on('ready', () => {
      console.log('Conexion Lista!');
      connectionReady();
  });

  client.on('auth_failure', () => {
      console.log('Error de autentificacion vuelve a generar el QRCODE');     
  })



  client.on('authenticated', (session) => {
      // Guardamos credenciales de de session para usar luego
      console.log("Guardando Session...")
      sessionData = session;
      fs.writeFile(SESSION_FILE_PATH,JSON.stringify(session), function (err) {
       if (err) {
              console.log("Error al leer la Session");
              deleteSession();
          }
      });
  });

  client.initialize();
}



const connectionReady = ()  =>  {
  
  
  listenMessage();

}


/**
 * Revisamos si existe archivo con credenciales!
 */
 (fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession()