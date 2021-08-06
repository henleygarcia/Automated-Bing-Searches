let correctAnswer;
document.addEventListener('CORRECT_ANSWER_RECEIVED', e => {
  correctAnswer = e.detail;
});

let shouldOpenRewardTasks;
chrome.runtime.onMessage.addListener((request, sender, cb) => {
  switch(request.type) {
    case 'OPEN_REWARD_TASKS': {
      shouldOpenRewardTasks = true;
      break;
    }
    default: {
      break;
    }
  }
});

const prefs = { ...constants.DEFAULT_PREFERENCES };

function clickOption(selector, parent = document) {
  const e = parent.querySelector(selector);
  if (e && e.getAttribute('data-serpquery')) e.click();
}

function clickElement(e, checkVisibility = true) {
  if (!e) return;
  // e.offsetParent checks that the element (and its parents) do not have the style property 'display: none'
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
  // this will break if e has style property 'position: fixed', but that shouldn't happen
  if (!checkVisibility || e.offsetParent) e.click();
}

function click(selector, parent = document) {
  const e = parent.querySelector(selector);
  clickElement(e);
}

function clickHidden(selector, parent = document) {
  const e = parent.querySelector(selector);
  clickElement(e, false);
}

function clickAll(selector, parent = document) {
  const elements = [...parent.querySelectorAll(selector)];
  elements.forEach(e => clickElement(e, true));
}

function clickLoop() {
  if (shouldOpenRewardTasks) {
    const cards = [...document.querySelectorAll('mee-card')];
    if (cards.length) {
      // we're actually on the rewards page now, so no need to keep trying to open tasks after this attempt
      shouldOpenRewardTasks = false;
      cards.forEach(card => {
        if (card.querySelector('.mee-icon-AddMedium')) {
          clickAll('a.c-call-to-action', card);
        }
      });
    }
  }

  if (prefs.autoClick) {
    click('#rqStartQuiz');
    clickOption('#currentQuestionContainer .b_cards[iscorrectoption=True]:not(.btsel)');
    clickOption(`#currentQuestionContainer .rqOption:not(.optionDisable)[data-option="${correctAnswer}"]`);
    clickOption('.bt_poll .btOption');

    // click the hidden element here since options are only available while the background is hidden.
    // once the background is not hidden, that means the results are being shown.
    clickHidden('#OptionBackground00.b_hide');
  
    // the correctAnswer variable doesn't work anymore for "this or that"
    // because the window variable doesn't have the same value as the data-option
    clickOption(`#currentQuestionContainer .btOptionCard[data-option="${correctAnswer}"]`);

    // either guess randomly or attempt the correct guess (only works on mobile view)
    // but at least give the option to guess randomly instead of forcing it to be correct
    // since this is a risky thing to get 100% correct
    if (prefs.randomGuesses) clickOption('#currentQuestionContainer .btOptionCard');
    else click('.bt_correctOp'); // only works on mobile view

  
    // for some reason, testYourSmartsOption.onmouseup returns null
    // as a workaround, parse the search URL from the attribute and manually go to it
    const testYourSmartsOption = document.querySelector('#ListOfQuestionAndAnswerPanes div[id^=QuestionPane]:not(.wk_hideCompulsary) .wk_paddingBtm');
    if (testYourSmartsOption) {
      let smartsLink = testYourSmartsOption.getAttribute('onmouseup');
      if (smartsLink) {
        const startIndex = smartsLink.indexOf('/search');
        if (startIndex !== -1) {
          smartsLink = smartsLink.substring(startIndex, smartsLink.length - 2);
          window.location.href = `https://bing.com${smartsLink}`;
        }
      }
    }
  
    // this actually might not be necessary, but we can leave it in anyway
    click('#ListOfQuestionAndAnswerPanes div[id^=AnswerPane]:not(.b_hide) input[type=submit]');
  }
}

getStorage([
  'autoClick',
  'randomGuesses',
], prefs).then(() => {
  setInterval(clickLoop, constants.CLICK_DELAY);
});

hookStorage([
  'autoClick',
  'randomGuesses',
], prefs);
