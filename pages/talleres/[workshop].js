import React, {useState, useEffect} from 'react'
import {GraphQLClient, gql} from 'graphql-request'
import MarkdownIt from 'markdown-it/lib';

export default function workshop({data}) {

  const {taller} = data;
  const [description, setDescription] = useState("");
  
  useEffect(() => {
    const md = new MarkdownIt();
    setDescription(md.render(taller.descripcion));
  }, [])
  

  return (
    <div style={{display: "flex", flexDirection:"column",alignItems:"center", marginTop: "20px"}}>
      <h1>{taller.titulo}</h1>
      <p dangerouslySetInnerHTML={{__html:description}}></p>
      <form style={{marginTop:"50px"}} action={"/api/submit/workshop"}>
        <label htmlFor="email">Email</label><br/>
        <input type="text" id="email" name="email"/><br/>
        <label htmlFor="Nombre">First name:</label><br/>
        <input type="text" id="Nombre" name="Nombre"/><br/>
        <label htmlFor="Apellido">Last name:</label><br/>
        <input type="text" id="Apellido" name="Apellido"/><br/>
        <input type="hidden" readOnly value={taller.identificador} name="id" id="id"/>
        <input type="submit" value="Submit"/>
      </form>
    </div>
  )
}

export async function getServerSideProps(context){
  
  const {workshop} = context.query;
  
  const endpoint = process.env.GRAPH_URL;
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: 'Bearer '+process.env.GRAPH_TOKEN,
    },
  })

  const query = gql`
  {
    taller(where: {identificador: "${workshop}"}) {
      titulo
      descripcion
      identificador
    }
  }  
  `

  const data = await graphQLClient.request(query)
  if(data.taller == null){
    context.res.setHeader('Location', '/404');
    context.res.statusCode = 302;
    context.res.end();
    return {
      props:{},
    }
  }
  return { props: {data}};
}
