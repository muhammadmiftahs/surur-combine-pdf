// script.js
const { PDFDocument } = PDFLib; // only used for merge
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList  = document.getElementById('file-list');
const mergeBtn  = document.getElementById('merge-btn');
const statusDiv = document.getElementById('status');
let selectedFiles = [];

// Create <object> preview for PDF
function createPreviewObject(file) {
  const url = URL.createObjectURL(file);
  const embed = document.createElement('object');
  embed.type = 'application/pdf';
  embed.data = url;
  embed.width = 80;
  embed.height = 100;
  return embed;
}

// Update horizontal list
function updateFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file) => {
    const li = document.createElement('li');
    li.classList.add('animate__animated', 'animate__fadeInUp');

    const handle = document.createElement('i');
    handle.className = 'fa-solid fa-grip-lines handle';

    const preview = createPreviewObject(file);
    const label = document.createElement('p');
    label.textContent = file.name;
    label.className = 'text-xs truncate mt-2';

    li.append(handle, preview, label);
    fileList.appendChild(li);
  });
}

// Init horizontal Sortable once
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

// Drag & drop and file input
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

// Merge PDF
mergeBtn.addEventListener('click', async () => {
  if (!selectedFiles.length) {
    alert('Pilih file PDF terlebih dahulu!');
    return;
  }
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
