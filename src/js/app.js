App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-gender').text(data[i].gender);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }

      populateDropdowns();
    });
    return App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
  
      try {
        // Only request once and wait
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.error("User denied account access", error);
        alert("❌ MetaMask connection rejected.");
        return;
      }
  
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      web3 = new Web3(window.web3.currentProvider);
    } else {
      // Fallback to local Ganache if MetaMask is not available
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
  
    return App.initContract();
  },    

  initContract: function() {
    $.getJSON('Adoption.json')
      .then(function(data) {
        App.contracts.Adoption = TruffleContract(data);
        App.contracts.Adoption.setProvider(App.web3Provider);
        App.bindEvents(); // Call events after contract is ready
        return App.markAdopted();
      })
      .catch(function(error) {
        console.error("❌ Failed to load contract:", error);
      });
  },  

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-search', searchDogs);
    $(document).on('click', '.btn-find-dog', showSelectionForm);
  },

  markAdopted: function() {
    App.contracts.Adoption.deployed().then(function(instance) {
      return instance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(console.log);
  },

  handleAdopt: function(event) {
    event.preventDefault();
    var petId = parseInt($(event.target).data('id'));
  
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
        alert("❌ Failed to get accounts.");
        return;
      }
  
      var account = accounts[0];
      App.contracts.Adoption.deployed().then(function(instance) {
        return instance.adopt(petId, { from: account });
      }).then(function(result) {
        alert("🎉 Adoption successful!");
        App.markAdopted();
      }).catch(function(err) {
        console.error(err);
        alert("❌ Adoption failed. Please try again.");
      });
    });
  }
  }


$(function() {
  $(window).load(App.init);
});

function convertAgeToMonths(age) {
  if (typeof age === 'string' && age.toLowerCase().includes('month')) {
    return parseFloat(age);
  } else if (typeof age === 'string' && age.toLowerCase().includes('year')) {
    return parseFloat(age) * 12;
  }
  return 0;
}

function getSelectedFilters() {
  return {
    age: document.getElementById('age').value,
    breed: document.getElementById('breed').value,
    gender: document.getElementById('gender').value,
    location: document.getElementById('location').value
  };
}

function searchDogs() {
  const filters = getSelectedFilters();
  console.log("Filters", filters);

  // Loading local pets.json instead of fetching from server
  fetch('pets.json')
    .then(response => response.json())
    .then(allPets => {
      console.log('Loaded pets:', allPets);

      // Filter pets locally
      const filteredPets = allPets.filter(pet => {
        const matchAge = filters.age === 'all' || 
                         (filters.age === 'puppy' && pet.age < 1) ||
                         (filters.age === 'adult' && pet.age >= 1);
        const matchBreed = filters.breed === 'All Breeds' || pet.breed === filters.breed;
        const matchGender = filters.gender === 'All Genders' || pet.gender === filters.gender;
        const matchLocation = filters.location === 'All' || pet.location === filters.location;

        return matchAge && matchBreed && matchGender && matchLocation;
      });

      console.log('Filtered pets:', filteredPets);

      if (filteredPets.length === 0) {
        $('#resultsPage').hide();
        $('#noResultsMessage').addClass('show');//for dogselection, if pet isnt avaialbel
        setTimeout(() => {
          $('#noResultsMessage').removeClass('show'); 
        }, 3000); //(3000 milliseconds = 3 seconds)
        return;
      }      

      displayFilteredPets(filteredPets);
      showResultsPage();
    })
    .catch(error => {
      console.error('Error loading pets.json:', error);
    });
}

function displayFilteredPets(filteredPets) {
  var petsRow = $('#petsRow');
  petsRow.empty();
  var petTemplate = $('#petTemplate');
  filteredPets.forEach(pet => {
    var petClone = petTemplate.clone();
    petClone.find('.panel-title').text(pet.name);
    petClone.find('img').attr('src', pet.picture);
    petClone.find('.pet-breed').text(pet.breed);
    petClone.find('.pet-age').text(pet.age);
    petClone.find('.pet-gender').text(pet.gender);
    petClone.find('.pet-location').text(pet.location);
    petClone.find('.btn-adopt').attr('data-id', pet.id);
    petsRow.append(petClone.html());
  });
}

function showSelectionForm() {
  currentView = 'selection';
  document.body.className = 'filter-view';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('mainInfoSection').style.display = 'none';
  document.getElementById('dogSelection').style.display = 'block';
  document.getElementById('resultsPage').style.display = 'none';
}

function showResultsPage() {
  currentView = 'results';
  document.body.className = 'results-view';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('mainInfoSection').style.display = 'none';
  document.getElementById('dogSelection').style.display = 'none';
  document.getElementById('resultsPage').style.display = 'block';
}

function goBack() {
  if (currentView === 'results') {
    showSelectionForm();
  } else if (currentView === 'selection') {
    currentView = 'main';
    document.body.className = 'main-view';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('mainInfoSection').style.display = 'block';
    document.getElementById('dogSelection').style.display = 'none';
    document.getElementById('resultsPage').style.display = 'none';
  }
}

function populateDropdowns() {
  const locations = ['All', 'London', 'Oxford', 'Cambridge', 'Birmingham'];
  const genders = ['All Genders', 'Female', 'Male'];
  const dogBreeds = [
    { letter: 'All', names: ['All Breeds'] },
    { letter: 'A', names: ['Akita', 'American Cocker Spaniel'] },
    { letter: 'B', names: ['Beagle', 'Boxer'] },
    { letter: 'C', names: ['Chihuahua', 'Corgi'] },
    { letter: 'D', names: ['Dalmatin', 'Doberman'] },
    { letter: 'E', names: ['English Springer Spaniel'] },
    { letter: 'F', names: ['French Bulldog'] },
    { letter: 'G', names: ['Golden Retriever'] },
    { letter: 'H', names: ['Husky'] },
    { letter: 'I', names: ['Irish Setter'] },
  ];

  const breedDropdown = $('#breed');
  const locationDropdown = $('#location');
  const genderDropdown = $('#gender');

  breedDropdown.empty();
  locationDropdown.empty();
  genderDropdown.empty();

  locations.forEach(location => locationDropdown.append(`<option value="${location}">${location}</option>`));
  dogBreeds.forEach(group => {
    breedDropdown.append(`<option disabled>${group.letter}</option>`);
    group.names.forEach(breed => breedDropdown.append(`<option value="${breed}">${breed}</option>`));
  });
  genders.forEach(g => genderDropdown.append(`<option value="${g}">${g}</option>`));
}

$(document).ready(function () {
  populateDropdowns();

  if (currentView === 'main') {
    document.getElementById('mainInfoSection').style.display = 'block';
  } else {
    document.getElementById('mainInfoSection').style.display = 'none';
  }
});
