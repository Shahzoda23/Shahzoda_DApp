pragma solidity ^0.5.16;

contract Adoption {
    address[23] public adopters;

    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId < adopters.length, "Invalid pet ID");
        adopters[petId] = msg.sender;
        return petId;
    }

    function getAdopters() public view returns(address[23] memory) {
        return adopters;
    }
}
