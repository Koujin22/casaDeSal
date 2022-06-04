import { google } from 'googleapis';
import { MailService } from '@sendgrid/mail';
import fs from 'fs'

const spreadsheetId = process.env.SPREADSHEET_ID;
const sheets = google.sheets('v4');

export default async function handler(req, res) {
    const {id, Nombre, email} = req.query;
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
            headers.push(id);
            await UpdateHeaders(jwtClient, headers);
        }

        if(exists){
            //We parse the values return from sheets to create a local object that represents the entry.
            console.log("Parsing values from sheet into js object");
            let currentValues = {};
            for(let i = 0; i < headers.length; i++){
                currentValues[headers[i]] = values[i];
            }
                    
            //We merge existing entry and the new values we recieved
            let modified = false;
            headers.forEach(header => {
                if(header == id && typeof currentValues[id] == 'undefined') {
                    currentValues[id] = "Inscrito"
                    modified = true;
                    return;
                }
                if(currentValues[header] != req.query[header]){
                    currentValues[header] = req.query[header];
                    modified = true;
                }
            })

            //we update the entry
            if(modified){
                console.log("Saving in sheet new values");
                console.log("Current values: ", currentValues);
                await UpdateToSheet(currentValues, "A"+range, jwtClient);
            }
        }else {
            //We change the id attribute to match sheets schema
            
            let newValues = headers.map(header=>{
                if(header == id) return "Inscrito";
                if(req.query[header]) return req.query[header];
                return "";
            })
            
            Object.keys(req.query).map(element=>{
                if(element == 'id') return "Inscrito";
                return req.query[element];
            })
            //we create a new entry
            //Append to google sheet
            await AppendToSheet(newValues, jwtClient);
        }  
    }catch(err){
        console.error(err);
    }finally{
        //We send a notifiaction email with all the data regardless of what happened
        let sgMail = new MailService();
        sgMail.setApiKey(process.env.SENDGRID_TOKEN)
        const msg = {
            to: 'emiliano@bfgo.mx', // Change to your recipient
            from: 'emilianohhgg@gmail.com', // Change to your verified sender
            subject: 'Sending with SendGrid is Fun@',
            text: `and easy to do anywhere, even with Node.js. Nombre: ${Nombre}, Correo: ${email}`,
            html: `<strong>and easy to do anywhere, even with Node.js Nombre: ${Nombre}, Correo: ${email}</strong> `,
          }
        const response = await sgMail.send(msg)
        console.log(response); 
        res.redirect("/completed", 302);
        //res.redirect("/talleres/prueba", 302);

    }
}

async function UpdateHeaders(auth, headers){
    const body = {
        values:  [
            headers
        ]
    };

    //saving in sheets
    let response = await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        valueInputOption: "RAW",
        range: "Sheet1!A1",
        auth: auth,
        resource: body
    })
    var result = response.data;
    console.log(`${result.updatedCells} cells updated.`)
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

async function AppendToSheet(values, auth){
    const body = {
        values:  [
            values
        ]
    };

    //saving in sheets
    let response = await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        valueInputOption: "RAW",
        range: "Sheet1",
        auth: auth,
        resource: body
    })
    var result = response.data;
    console.log(`${result.updates.updatedCells} cells appended.`)
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