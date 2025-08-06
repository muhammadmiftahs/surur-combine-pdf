// script.js
const { PDFDocument } = PDFLib;
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList  = document.getElementById('file-list');
const mergeBtn  = document.getElementById('merge-btn');
const statusDiv = document.getElementById('status');
let selectedFiles = [];

// Render thumbnail for each PDF file
async function renderThumbnail(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const page = pdf.getPage(0);
  const viewport = page.getViewport({ scale: 0.2 });

  // create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // render to canvas (via pdf-lib to SVG then image is complex)
  // fallback: use object URL for embed preview
  const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }));
  const embed = document.createElement('object');
  embed.type = 'application/pdf';
  embed.data = url;
  embed.width = viewport.width;
  embed.height = viewport.height;
  return embed;
}

// Update horizontal list
async function updateFileList() {
  fileList.innerHTML = '';
  for (const file of selectedFiles) {
    const li = document.createElement('li');
    li.classList.add('animate__animated', 'animate__fadeInUp');
    const handle = document.createElement('i');
    handle.className = 'fa-solid fa-grip-lines handle';
    const thumb = await renderThumbnail(file);
    const label = document.createElement('p');
    label.textContent = file.name;
    label.className = 'text-xs truncate mt-2';

    li.append(handle, thumb, label);
    fileList.appendChild(li);
  }
}

// Init Sortable horizontal
document.addEventListener('DOMContentLoaded', () => {
  new Sortable(fileList, {
    direction: 'horizontal',
    handle: '.handle',
    animation: 200,
    onEnd(evt) {
      const [moved] = selectedFiles.splice(evt.oldIndex, 1);
      selectedFiles.splice(evt.newIndex, 0, moved);
    }
  });
});

// Drag/drop & file input
['dragenter','dragover','dragleave','drop'].forEach(evt =>
  dropZone.addEventListener(evt, e => e.preventDefault())
);
dropZone.addEventListener('drop', e => {
  selectedFiles = Array.from(e.dataTransfer.files)
    .filter(f => f.type === 'application/pdf');
  updateFileList();
});
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  selectedFiles = Array.from(e.target.files);
  updateFileList();
});

// Merge
mergeBtn.addEventListener('click', async () => {
  if (!selectedFiles.length) return alert('Pilih file PDF terlebih dahulu!');
  statusDiv.textContent = 'Menggabungkan...';

  const pdfDoc = await PDFDocument.create();
  for (const file of selectedFiles) {
    const buf   = await file.arrayBuffer();
    const donor = await PDFDocument.load(buf);
    const pages = await pdfDoc.copyPages(donor, donor.getPageIndices());
    pages.forEach(p => pdfDoc.addPage(p));
  }

  const merged = await pdfDoc.save();
  const blob   = new Blob([merged], { type: 'application/pdf' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = 'merged.pdf';
  a.click();

  statusDiv.textContent = 'Selesai! File telah diunduh.';
});
