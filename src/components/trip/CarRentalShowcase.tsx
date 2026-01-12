import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

const CarRentalShowcase: React.FC = () => {
  const cars = [
    {
      id: 1,
      name: "2021 GL8",
      type: "Luxury Van",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Buick_GL8_ES_facelift_003.jpg/640px-Buick_GL8_ES_facelift_003.jpg", // Placeholder - replace with your assets
      rating: 5
    },
    {
      id: 2,
      name: "Tesla Model Y",
      type: "Electric SUV",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tesla_Model_Y_001.jpg/640px-Tesla_Model_Y_001.jpg",
      rating: 5
    },
    {
      id: 3,
      name: "BMW X5",
      type: "Luxury SUV",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/BMW_X5_%28G05%29_IMG_3680.jpg/640px-BMW_X5_%28G05%29_IMG_3680.jpg",
      rating: 4
    }
  ];

  return (
    <div className="mt-2 pb-8">
      <h3 className="font-serif text-lg font-bold text-gray-800 mb-4">Car rent</h3>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
        {cars.map((car) => (
          <div 
            key={car.id} 
            className="shrink-0 w-36 bg-white p-2 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="w-full h-20 mb-2 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
              <img src={car.image} alt={car.name} className="w-full h-full object-cover mix-blend-multiply" />
            </div>
            <h4 className="text-xs font-bold text-gray-800">{car.name}</h4>
            <div className="flex items-center justify-between mt-1">
               <span className="text-[10px] text-gray-400">{car.type}</span>
               <div className="flex">
                 {[...Array(5)].map((_, i) => (
                   <StarIcon key={i} className={`w-2 h-2 ${i < car.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                 ))}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarRentalShowcase;