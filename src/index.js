console.log('hello world');

const output = document.getElementById('output');

document.getElementById('encode').onclick = function(event) {
    this.disabled = true;
    output.textContent = 'contacting server';

    fetch('/encode', {
        method: 'POST',
        body: 'do it' // ignored
    }).then(response => response.json()).then((url) => {
        this.disabled = false;

        const link = document.createElement('a');
        link.href = url;
        link.textContent = url;

        output.textContent = '';
        output.appendChild(link);
    });
};
