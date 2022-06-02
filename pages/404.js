import Link from 'next/link'

export default function FourOhFour() {
  return <div style={{display:"flex", flexDirection:"column", alignItems:"center", margin:"100px"}}>
    <h1>404 - La pagina que buscas no fue encontrada.</h1>
    <Link href="/">
      <a style={{color: "blue"}}>
        Da click aqui para regresar al inicio.
      </a>
    </Link>
  </div>
}