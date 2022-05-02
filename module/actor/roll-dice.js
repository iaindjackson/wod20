/* global ChatMessage, Roll, game */

// Function to roll dice
export async  function rollDice(
  numDice,
  actor,
  label = "",
  difficulty = 6,
  useHunger, 
  specialty, 
  wound
  ) {
  
  function healthModifier (wound) {
      // pick health value from ordered key (see health.html for the order)
      switch(true) {
        case wound=="hurt": 
          return -1
        case wound=="injured": 
          return -1
        case wound=="wounded": 
          return -2
        case wound=="mauled": 
          return -2 
        case wound=="crippled": 
          return -5
        case wound=="incapacitated" : 
          return -10000000
        default: 
          return 0
      }
  }

  let dice = numDice + healthModifier(wound);

  if (difficulty <= 0) {
    difficulty = 6;
  }

  const roll = new Roll(dice + "dvcs>11", actor.data.data);
  await roll.evaluate();
  let difficultyResult = "<span></span>";
  let success = 0;
  let botch = 0;

  for (const dice of roll.terms[0].results) {
    if (dice.result >= difficulty) {
      if (specialty && dice.result === 10) {
        success = success + 2;
      } else {
        success = success + 1;
      }
    } else if (dice.result === 1) {
      botch++;
    }
  }

  const totalSuccess = Math.max(success - botch, 0);

  difficultyResult = `( <span class="danger">${game.i18n.localize(
    "WOD20.Fail"
  )}</span> )`;

  if (totalSuccess > 0) {
    difficultyResult = `( <span class="success">${game.i18n.localize(
      "WOD20.Success"
    )}</span> )`;
  }

  if (success <= 0 && botch > 0) {
    difficultyResult = `( <span class="danger">${game.i18n.localize(
      "WOD20.Botch"
    )}</span> )`;
  }

  label = `<p class="roll-label uppercase">${label}</p>`;

  label =
    label +
    `<p class="roll-label result-success">${game.i18n.localize(
      "WOD20.Successes"
    )}: ${totalSuccess} ${difficultyResult}</p>`;

  for (const dice of roll.terms[0].results) {
    label =
      label +
      `<img src="systems/wod20/assets/images/diceimg_${dice.result}.png" alt="Normal Fail" class="roll-img normal-dice" />`;
  }

  label = label + "<br>";

  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: label,
  });
}