/* As 12 figuras para a criança escolher no login (a1…a12). A criança lembra da figura, não de um nome de usuário. */
window.PM_AVATARES=[
  {k:"a1",id:25,em:"⚡",nome:"Pikachu"},{k:"a2",id:1,em:"🌱",nome:"Bulbasaur"},{k:"a3",id:4,em:"🔥",nome:"Charmander"},{k:"a4",id:7,em:"💧",nome:"Squirtle"},
  {k:"a5",id:133,em:"🦊",nome:"Eevee"},{k:"a6",id:39,em:"🎤",nome:"Jigglypuff"},{k:"a7",id:54,em:"🦆",nome:"Psyduck"},{k:"a8",id:52,em:"🐱",nome:"Meowth"},
  {k:"a9",id:258,em:"🐟",nome:"Mudkip"},{k:"a10",id:255,em:"🐥",nome:"Torchic"},{k:"a11",id:393,em:"🐧",nome:"Piplup"},{k:"a12",id:175,em:"🥚",nome:"Togepi"}];
window.PM_avatarHtml=(a,cls)=>`<img class="${cls||""}" alt="${a.nome}" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${a.id}.png" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emo',textContent:'${a.em}'}))">`;
