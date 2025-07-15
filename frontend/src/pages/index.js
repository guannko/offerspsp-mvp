import Head from 'next/head';
  import { useState } from 'react';

  export default function Home() {
    const [formData, setFormData] = useState({
      companyName: '',
      email: '',
      license: '',
      volume: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log('Application submitted:', formData);
      alert('Application submitted successfully!');
    };

    return (
      <>
        <Head>
          <title>OffersPSP - Professional B2B Gaming Platform</title>
          <meta name="description" content="Connecting online casinos with PSP providers" />
        </Head>

        <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center text-white max-w-4xl mx-auto">
              <h1 className="text-6xl font-bold mb-8">OffersPSP</h1>
              <p className="text-2xl mb-12 text-blue-100">
                Professional B2B platform connecting online casinos with payment solution providers
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">🎯 For Casinos</h3>
                  <p>Find qualified PSP providers for your gaming platform</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">💳 For PSPs</h3>
                  <p>Connect with verified online casino operators</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">🤝 Secure Deals</h3>
                  <p>Professional mediation and deal facilitation</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="bg-green-500 hover:bg-green-600 text-white px-12 py-4 rounded-lg font-semibold text-lg">
                  Submit Application
                </button>
                <button className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-12 py-4 rounded-lg font-semibold text-lg">
                  Browse PSP Offers
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }