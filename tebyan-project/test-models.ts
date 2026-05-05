async function list() {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCDBmspCIjcnrOyWcr8iR0P7ddT4kiF-io");
    const data = await res.json();
    console.log(data.models.map(m => m.name));
}
list();
