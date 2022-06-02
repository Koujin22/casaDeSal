import React, {useState} from 'react'

export default function Asistencia({ asistencia }) {
    const taller = asistencia;

    const [email, setEmail] = useState("")
    const [msg, setMsg] = useState("")

    const submitAsistencia = async (e) => {
        e.preventDefault();
        let {json, status} = await postData(`/api/submit/asistencia?email=${email}&id=${taller}`);
        setMsg(json.msg);
        if(status == 200){
            setEmail("");
        }
    }

    return (
        <div style={{display: "flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginTop:"100px"}}>
            <div>Asistencia</div>
            <form style={{display: "flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginTop:"100px"}} onSubmit={submitAsistencia}>
                <label htmlFor="email">Email</label><br />
                <input value={email} onChange={e=>setEmail(e.target.value)} type="text" id="email" name="email" /><br />
                <input type="submit" value="Submit" />
            </form>
            <div hidden={msg===""}>{msg}</div>
        </div>)
}


export async function getServerSideProps(context) {

    const { asistencia } = context.query;
    console.log(asistencia)
    return { props: { asistencia } };
}

async function postData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return {json: await response.json(), status:response.status}; // parses JSON response into native JavaScript objects
  }