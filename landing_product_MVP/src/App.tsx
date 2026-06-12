import ScrollVideo from "./components/ScrollVideo";

function App() {
  return (
    <>
      <ScrollVideo />

      <div id="scroll-container" className="h-[500vh]">
        <section className="h-screen flex items-center justify-right">
          <h1 className="text-6xl font-bold text-black">
            Producto Revolucionario
          </h1>
        </section>

        <section className="h-screen flex items-center justify-right">
          <h2 className="text-5xl text-gray">
            Más rápido
          </h2>
        </section>

        <section className="h-screen flex items-center justify-right">
          <h2 className="text-5xl text-gray">
            Más potente
          </h2>
        </section>

        <section className="h-screen flex items-center justify-right">
          <h2 className="text-5xl text-gray">
            Más inteligente
          </h2>
        </section>
      </div>
    </>
  );
}

export default App;