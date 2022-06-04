import { google } from 'googleapis';
import { MailService } from '@sendgrid/mail';
import fs, { rmSync } from 'fs'

const spreadsheetId = process.env.SPREADSHEET_ID;
const sheets = google.sheets('v4');

export default async function handler(req, res) {
    const {id, email} = req.query;
    try{
        //Auth to google 
        console.log("Logging to google cloud services");
        const jwtClient = AuthToGoogle();

        //check if email already exists and return all columns with headers. 
        console.log("Checking if email exists");
        const {exists, range, headers, values} = await CheckEmailExists(req.query, jwtClient);
        console.log("Exists: ", exists);

        //If the workshop to register is not in the headers we add it
        console.log("Checking if workshop exists in sheets");
        if(!headers.includes(id)){
            console.log("Doesnt exists, Adding it to sheets");
            res.status(412).json({msg:"El taller no se encuentra registrado en sheets! Revisa el nombre del taller."})
        }

        if(exists){
            //We parse the values return from sheets to create a local object that represents the entry.
            console.log("Parsing values from sheet into js object");
            let currentValues = {};
            for(let i = 0; i < headers.length; i++){
                currentValues[headers[i]] = values[i];
            }
            if(currentValues[id] === "Inscrito"){
                currentValues[id] = "Asistido";
                console.log("Current values: ", currentValues);
                await UpdateToSheet(currentValues, "A"+range, jwtClient);
                res.status(200).json({msg:"Asistencia tomada correctamente!"})
            } else if(currentValues[id]==="Asistido"){
                console.log("El usuario ya tiene asistencia")
                res.status(200).json({msg:"El usuario ya se registro su asistencia!"})
            } else{
                console.log("El usuario no esta inscrito!")
                res.status(409).json({msg:"El usuario no se incribio al taller"})
            }
        }else {
            res.status(404).json({msg:"El email no fue encontrado en los inscritos!"})
        }  
    }catch(err){
        console.error(err);
        res.status(500).json({msg: err});
    }
}

async function CheckEmailExists({email}, auth){
    let response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: "Sheet1",
        auth: auth,        
    })
    let result = response.data.values;
    let indexFound = -1;
    let exists = result.find((savedEmail, i) =>{
        indexFound = i;
        return savedEmail[0].toLowerCase() === email.toLowerCase();
    })
    if(exists)
        return {exists: true, range: indexFound+1, headers: result[0], values: result[indexFound]};
    else
        return {exists: false, range: "", headers: result[0], values: []};
}

function AuthToGoogle(){
    let jwtClient = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets']);
    //authenticate request
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log("Successfully connected!");
        }
    });
    return jwtClient;
}

async function UpdateToSheet(values, range, auth){
    const body = {
        values:  [
            Object.values(values)
        ]
    };

    //saving in sheets
    let response = await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        valueInputOption: "RAW",
        range: "Sheet1!"+range,
        auth: auth,
        resource: body
    })
    
    var result = response.data;
    console.log(`${result.updatedCells} cells updated.`)
}