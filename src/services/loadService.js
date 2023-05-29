const { Load } = require('../models/Load');

const saveLoad = async ({
  name, payload, pickup_address, delivery_address, dimensions,
}) => {
  const load = new Load({
    name,
    payload,
    pickup_address,
    delivery_address,
    dimensions,
  });

  return await load.save();
};

function getTruckForLoad(width, length, height, weight) {
  const sprinter = [300, 250, 170, 1700];
  const smallStright = [500, 250, 170, 2500];
  const largeStright = [700, 350, 200, 4000];

  if (sprinter[0] > width && sprinter[1] > length && sprinter[2] > height && sprinter[3] > weight) {
    return ['sprinter', 'small stright', 'large stright'];
  }
  if (smallStright[0] > width && smallStright[1]
    > length && smallStright[2] > height && smallStright[3] > weight) {
    return ['small stright', 'large stright'];
  }
  if (largeStright[0] > width && largeStright[1]
    > length && largeStright[2] > height && largeStright[3] > weight) {
    return ['large stright'];
  }
}

module.exports = {
  saveLoad,
  getTruckForLoad,
};
