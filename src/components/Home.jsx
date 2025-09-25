import React from 'react'
import Hero from "./Hero/Hero";
import Services from "./Services/Services";
import Banner from "./Banner/Banner";
import Subscribe from "./Subscribe/Subscribe";
import Banner2 from "./Banner/Banner2";
import Footer from "./Footer/Footer";
function Home() {
  return (
    <div>
        <main className="overflow-x-hidden bg-white text-dark">
      <Hero />
      <Services />
      <Banner />
      <Subscribe />
      <Banner2 />
      <Footer />
    </main>
    </div>
  )
}

export default Home