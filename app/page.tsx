export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-xl text-green-700">StudentMarket</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">Ghana</span>
        </div>
        <div className="flex gap-3">
          <a href="/auth" className="text-gray-600 hover:text-green-700 font-medium px-4 py-2">
  Connexion
</a>
<a href="/vendre" className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg">
  Vendre un appareil
</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-green-700 text-white px-6 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Achète et vends tes appareils entre étudiants 🇬🇭
        </h1>
        <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
          Prix vérifiés automatiquement · Paiement Mobile Money · Vendeurs vérifiés
        </p>
        <div className="flex max-w-lg mx-auto gap-2">
          <input
            type="text"
            placeholder="Rechercher un appareil... ex: iPhone, laptop, casque"
            className="flex-1 px-4 py-3 rounded-lg text-gray-800 text-sm"
          />
          <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-lg">
            Rechercher
          </button>
        </div>
        <div className="flex justify-center gap-6 mt-6 text-sm text-green-200">
          <span>✅ Smartphones</span>
          <span>✅ Laptops</span>
          <span>✅ Casques</span>
          <span>✅ Tablettes</span>
          <span>✅ Consoles</span>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white px-6 py-8 flex justify-center gap-12 border-b">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-700">120+</p>
          <p className="text-gray-500 text-sm">Annonces actives</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-700">85+</p>
          <p className="text-gray-500 text-sm">Étudiants inscrits</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-700">98%</p>
          <p className="text-gray-500 text-sm">Prix vérifiés</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-700">MTN</p>
          <p className="text-gray-500 text-sm">MoMo accepté</p>
        </div>
      </section>

      {/* ANNONCES */}
      <section className="px-6 py-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Annonces récentes</h2>
          <div className="flex gap-2">
            <button className="bg-green-600 text-white text-sm px-3 py-1 rounded-full">Tous</button>
            <button className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full hover:bg-gray-200">Smartphones</button>
            <button className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full hover:bg-gray-200">Laptops</button>
            <button className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full hover:bg-gray-200">Audio</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Carte 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <div className="bg-gray-200 h-48 flex items-center justify-center text-5xl">📱</div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Prix vérifié</span>
                <span className="text-xs text-gray-400">Il y a 2h</span>
              </div>
              <h3 className="font-semibold text-gray-800 mt-2">Samsung Galaxy A54</h3>
              <p className="text-sm text-gray-500">Bon état · Utilisé 8 mois</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xl font-bold text-green-700">GHS 850</span>
                <span className="text-xs text-gray-400 line-through">Achat: GHS 1,400</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">👤 Kofi A. · KNUST</span>
                <span className="text-xs text-yellow-500 ml-auto">⭐ 4.8</span>
              </div>
              <button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg">
                Contacter le vendeur
              </button>
            </div>
          </div>

          {/* Carte 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <div className="bg-gray-200 h-48 flex items-center justify-center text-5xl">💻</div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Prix vérifié</span>
                <span className="text-xs text-gray-400">Il y a 5h</span>
              </div>
              <h3 className="font-semibold text-gray-800 mt-2">HP Pavilion 15 · i5</h3>
              <p className="text-sm text-gray-500">Très bon état · Utilisé 1 an</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xl font-bold text-green-700">GHS 2,200</span>
                <span className="text-xs text-gray-400 line-through">Achat: GHS 3,500</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">👤 Ama S. · UG Legon</span>
                <span className="text-xs text-yellow-500 ml-auto">⭐ 5.0</span>
              </div>
              <button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg">
                Contacter le vendeur
              </button>
            </div>
          </div>

          {/* Carte 3 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <div className="bg-gray-200 h-48 flex items-center justify-center text-5xl">🎧</div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ Prix élevé</span>
                <span className="text-xs text-gray-400">Il y a 1j</span>
              </div>
              <h3 className="font-semibold text-gray-800 mt-2">Oraimo FreePods 3</h3>
              <p className="text-sm text-gray-500">Bon état · Utilisé 3 mois</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xl font-bold text-green-700">GHS 180</span>
                <span className="text-xs text-gray-400 line-through">Achat: GHS 220</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">👤 Yaw M. · Ashesi</span>
                <span className="text-xs text-yellow-500 ml-auto">⭐ 4.5</span>
              </div>
              <button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg">
                Contacter le vendeur
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-white px-6 py-12 border-t">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Comment ça marche ?</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-8 max-w-3xl mx-auto text-center">
          <div className="flex-1">
            <div className="text-4xl mb-3">📸</div>
            <h3 className="font-semibold text-gray-800 mb-2">1. Prends 4 photos</h3>
            <p className="text-sm text-gray-500">Photos de ton appareil sous tous les angles</p>
          </div>
          <div className="flex-1">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-800 mb-2">2. L&apos;IA évalue le prix</h3>
            <p className="text-sm text-gray-500">On compare avec Jumia, Tonaton et Jiji automatiquement</p>
          </div>
          <div className="flex-1">
            <div className="text-4xl mb-3">💚</div>
            <h3 className="font-semibold text-gray-800 mb-2">3. Publie et vends</h3>
            <p className="text-sm text-gray-500">Reçois ton paiement via MTN MoMo ou Telecel Cash</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-gray-400 text-center py-6 text-sm">
        <p>🎓 StudentMarket Ghana · Fait par et pour les étudiants</p>
        <p className="mt-1">KNUST · UG Legon · Ashesi · GIMPA · UCC</p>
      </footer>
    </main>
  );
}