// FilterConstants.js
export const animalTypes = [
  {
    id: '2', 
    name: 'Chien', 
    icon: 'dog', 
    color: '#FF6B6B',
    lightColor: '#FFB3B3',
    shadowColor: '#FF6B6B'
  },
  {
    id: '3', 
    name: 'Chat', 
    icon: 'cat', 
    color: '#4ECDC4',
    lightColor: '#A8E6E1',
    shadowColor: '#4ECDC4'
  },
  {
    id: '20', 
    name: 'Oiseau', 
    icon: 'bird', 
    color: '#45B7D1',
    lightColor: '#A2D5F0',
    shadowColor: '#45B7D1'
  },
  {
    id: '21', 
    name: 'Poisson', 
    icon: 'fish', 
    color: '#96CEB4',
    lightColor: '#C8E6D6',
    shadowColor: '#96CEB4'
  },
  {
    id: '184', 
    name: 'Lapin', 
    icon: 'rabbit', 
    color: '#FFEAA7',
    lightColor: '#FFF5D3',
    shadowColor: '#FFEAA7'
  },
  {
    id: '31', 
    name: 'Reptile', 
    icon: 'lizard', 
    color: '#DDA0DD',
    lightColor: '#EDD0ED',
    shadowColor: '#DDA0DD'
  },
];

export const genderOptions = [
  {id: 'male', name: 'Mâle', icon: 'man-outline', color: '#4A90E2', lightColor: '#A4C8F0'},
  {id: 'female', name: 'Femelle', icon: 'woman-outline', color: '#E24A90', lightColor: '#F0A4C8'},
  {id: 'unknown', name: 'Non spécifié', icon: 'help-circle-outline', color: '#9B9B9B', lightColor: '#D5D5D5'},
];

export const ageRanges = [
  {id: 'baby', name: 'Bébé', description: '0-6 mois', value: [0, 0.5], icon: 'happy-outline', color: '#FFB6C1', lightColor: '#FFE3E8'},
  {id: 'young', name: 'Jeune', description: '6 mois - 2 ans', value: [0.5, 2], icon: 'flash-outline', color: '#87CEEB', lightColor: '#C3E4F5'},
  {id: 'adult', name: 'Adulte', description: '2-7 ans', value: [2, 7], icon: 'heart-outline', color: '#98FB98', lightColor: '#CCFDCC'},
  {id: 'senior', name: 'Senior', description: '7+ ans', value: [7, 20], icon: 'star-outline', color: '#DDA0DD', lightColor: '#EDD0ED'},
];

export const priceRanges = [
  {id: 'budget', name: 'Économique', description: '0-50€', value: [0, 50], icon: 'wallet-outline', color: '#90EE90', lightColor: '#C8F7C8'},
  {id: 'medium', name: 'Moyen', description: '50-200€', value: [50, 200], icon: 'card-outline', color: '#87CEEB', lightColor: '#C3E4F5'},
  {id: 'premium', name: 'Premium', description: '200-500€', value: [200, 500], icon: 'diamond-outline', color: '#DDA0DD', lightColor: '#EDD0ED'},
  {id: 'luxury', name: 'Luxe', description: '500€+', value: [500, 1000], icon: 'trophy-outline', color: '#FFD700', lightColor: '#FFEB80'},
];

export const sizeOptions = [
  {id: 'small', name: 'Petit', description: '< 10kg', icon: 'contract-outline', color: '#98FB98', lightColor: '#CCFDCC'},
  {id: 'medium', name: 'Moyen', description: '10-25kg', icon: 'remove-outline', color: '#87CEEB', lightColor: '#C3E4F5'},
  {id: 'large', name: 'Grand', description: '25-45kg', icon: 'add-outline', color: '#DDA0DD', lightColor: '#EDD0ED'},
  {id: 'xlarge', name: 'Très grand', description: '> 45kg', icon: 'expand-outline', color: '#FFB6C1', lightColor: '#FFE3E8'},
];

export const breedsByAnimal = {
  '2': ['Labrador', 'Golden Retriever', 'Berger Allemand', 'Bulldog', 'Beagle', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 'Siberian Husky'],
  '3': ['Persan', 'Maine Coon', 'Siamois', 'British Shorthair', 'Ragdoll', 'Bengal', 'Sphynx', 'Russian Blue', 'Scottish Fold', 'Abyssin'],
  '20': ['Canari', 'Perruche', 'Cacatoès', 'Inséparable', 'Conure', 'Ara', 'Gris du Gabon', 'Cockatiel', 'Amazone', 'Calopsite'],
  '21': ['Poisson rouge', 'Betta', 'Guppy', 'Néon', 'Platy', 'Molly', 'Corydoras', 'Angelfish', 'Discus', 'Tétras'],
  '184': ['Nain coloré', 'Angora', 'Bélier', 'Rex', 'Hollandais', 'Géant des Flandres', 'Tête de Lion', 'Mini Lop', 'Papillon', 'Chinchilla'],
  '31': ['Gecko', 'Iguane', 'Python', 'Boa', 'Tortue', 'Caméléon', 'Dragon barbu', 'Serpent des blés', 'Lézard', 'Pogona'],
};