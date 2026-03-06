export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-green-200 via-blue-200 to-slate-300 overflow-hidden">

      {/* Background Faceoff Image */}
      <img
        src="/images/Faceoff.jpg"
        alt="Lobbyists vs Environmentalists"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Title */}
        <header className="text-center py-12">
          <h1 className="text-7xl font-extrabold tracking-widest text-green-900 drop-shadow-lg">
            CLIMATE ACCORD
          </h1>

          <p className="mt-4 text-xl text-gray-700">
            A political strategy game about global climate policy
          </p>
           <p className="mt-4 text-xl text-gray-700">
            SENG 401 Group 10
          </p>
        </header>

        {/* Menu */}
        <main className="flex flex-1 items-center justify-center">

          <div className="flex flex-col gap-6 w-[420px]">

            <a
              href="/create-lobby"
              className="bg-green-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-green-900 
                         shadow-lg hover:scale-105 hover:bg-green-800 transition-all text-center"
            >
              CREATE LOBBY
            </a>

            <a
              href="/join-lobby"
              className="bg-blue-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-blue-900 
                         shadow-lg hover:scale-105 hover:bg-blue-800 transition-all text-center"
            >
              JOIN LOBBY
            </a>

            <a
              href="/profile"
              className="bg-gray-800 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-black 
                         shadow-lg hover:scale-105 hover:bg-gray-900 transition-all text-center"
            >
              PLAYER STATS
            </a>

          </div>

        </main>

        <footer className="text-center pb-6 text-gray-700">
          SENG 401 Serious Game Project
        </footer>

      </div>

    </div>
  );
}