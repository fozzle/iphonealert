'use strict';

const  rp = require('request-promise'),
  config = require('./config.json'),
  text = require('mtextbelt');

const URL = `http://www.apple.com/shop/retailStore/availabilitySearch?parts.0=MLY42LL%2FA&parts.1=MLMD2LL%2FA&parts.2=MLME2LL%2FA&parts.3=MLY32LL%2FA&location=${config.Location}`,
  PartsToColor = {
    'MLY42LL/A': 'Rose Gold',
    'MLMD2LL/A': 'Space Gray',
    'MLME2LL/A': 'Silver',
    'MLY32LL/A': 'Gold'
  },
  PartsList = Object.keys(PartsToColor);

rp({
  uri: URL,
  transform: (resp) => JSON.parse(resp)
})
.then((data) => {
  const inStockStores = data.body.stores.filter((store) => {
    let inStockColors = PartsList.filter((part) => {
      return store.partsAvailability[part].pickupDisplay != 'ships-to-store'
    });

    return store.storedistance < config.MaxDist && inStockColors.length;
  }).map((store) => {
    store.availColors = PartsList.filter((part) => {
      return store.partsAvailability[part].pickupDisplay != 'ships-to-store';
    }).map((part) => {
      return PartsToColor[part];
    }).join(', ');

    return store;
  });

  if (!inStockStores.length) {
    console.log('No iphones found :(');
    return;
  }

  let body = `iPhones found!\n`;
  inStockStores.forEach((store) => {
    body += `${store.storeName}: ${store.availColors}\n`;
  });
  console.log(body);
  text.send(config.TargetPhoneNumber, body, function(err) {
    if (err) console.log(err);
  });
})
.catch((err) => {
  console.error(err);
});
