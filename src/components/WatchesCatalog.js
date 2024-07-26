import React from 'react';
import './WatchesCatalog.css';  // Make sure to create and import this CSS file
import { Link } from 'react-router-dom';

// Placeholder images
const brands = [
  { name: 'Rolex', logo: require('../brandImages/rolexLogo.png'), link: 'https://www.rolex.com/en-us/watches/find-rolex' },
  { name: 'IWC', logo: require('../brandImages/IWCLogo.png'), link: 'https://www.iwc.com/en/watches.html' },
  { name: 'Omega', logo: require('../brandImages/omegaLogo.png'), link: 'https://www.omegawatches.com/watches' },
  { name: 'Breitling', logo: require('../brandImages/breitlingLogo.png'), link: 'https://www.breitling.com/us-en/watches/all/' },
  { name: 'Panerai', logo: require('../brandImages/paneraiLogo.png'), link: 'https://www.panerai.com/en/collections/watch-collection.html' },
  { name: 'Tag Heuer', logo: require('../brandImages/tagLogo.png'), link: 'https://www.tagheuer.com/ca/en/collection-dispatch/collection-dispatch.html' },
  { name: 'Zenith', logo: require('../brandImages/zenithLogo.png'), link: 'https://www.zenith-watches.com/en_ca/products/watches' },
  { name: 'Audemars Piguet', logo: require('../brandImages/audemarsLogo.png'), link: 'https://www.audemarspiguet.com/com/en/watch-collection.html' },
  { name: 'Cartier', logo: require('../brandImages/cartierLogo.png'), link: 'https://www.cartier.com/en-ca/watches/collections/' },
  { name: 'Patek Philippe', logo: require('../brandImages/patekLogo.png'), link: 'https://www.patek.com/en/collection/all-models' },
  { name: 'Jaeger-LeCoultre', logo: require('../brandImages/pngegg.png'), link: 'https://www.jaeger-lecoultre.com/ca-en/watches/all-watches' },
];

const WatchesCatalog = () => {
  return (
    <div className="container mt-4">
      <h1>Welcome to the Watch Market</h1>
      <div className="brand-grid">
        {brands.map((brand, index) => (
          <Link to={brand.link} key={index} className="brand-square">
            <img src={brand.logo} alt={`${brand.name} logo`} className="brand-logo" />
            <p>{brand.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WatchesCatalog;
