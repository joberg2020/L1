const form = document.querySelector('form');
const button = document.querySelector('#button');
const output = document.getElementById('output');
const statusElem = document.getElementById('status');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  button.setAttribute('disabled', true);
  handleSubmit(e);
});
output.addEventListener('load', () => {
  output.classList.remove('hidden');
});

/**
 * Get random meme from API
 *
 * @param {event} event - The submit event object.
 */
async function handleSubmit(event) {
  const name = getName();
  clearForm();
  try {
    validateName(name);
    statusElem.innerText = `My dear ${name}, please wait `+
    ' while I am loading your meme...';
    statusElem.classList.remove('hidden');
    const url = await fetchMeme(name);
    output.src = url;
    activateForm();
  } catch (error) {
    statusElem.classList.remove('hidden');
    statusElem.innerText = error.message;
    button.removeAttribute('disabled');
  }
}

/**
 * Clear the input field.
 */
function clearForm() {
  const textField = document.getElementById('input');
  textField.value = '';
  resetStatus();
}

/**
 * Fetch a meme-url from the API.
 * @param {String} name - The name of the meme.
 * @return {JSON} - The meme-Url as JSON.
 * @throws {Error} - If the network response was not ok.
 */
async function fetchMeme(name) {
  try {
    const response = await fetch('/memes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name}),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const json = await response.json();
    const url = json.imageUrl;
    return url;
  } catch (error) {
    console.error(error.stack);
    console.log('error: ', error.message);
    throw error;
  }
}

/**
 * Validates that the name is between 2 and 20 characters long
 * and only contains letters and numbers.
 * @param {String} userName - The name to validate.
 * @throws {Error} - If the name is not valid.
 */
function validateName(userName) {
  console.log('Validating name...' + userName);
  if (userName.length < 2 || userName.length > 20) {
    console.log('Name was faulty');
    throw new Error('Name must be between 2 and 20 characters long');
  }
  if (!/^[a-zA-Z0-9åäöÅÄÖæÆøØ]+$/.test(userName)) {
    throw new Error('Name must only contain letters and numbers');
  }
}

/**
 * Returns the name from the form.
 * @return {String} - The name from the form.
 */
function getName() {
  const formData = new FormData(form);
  return formData.get('name').trim();
}

/**
 * Enables the submitbutton again and clears the status message.
 */
function activateForm() {
  button.removeAttribute('disabled');
  resetStatus();
}

/**
 * Resets the status message.
 */
function resetStatus() {
  statusElem.innerText = '';
  statusElem.classList.add('hidden');
}
