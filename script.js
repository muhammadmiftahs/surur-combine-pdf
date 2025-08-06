// script.js
const { PDFDocument } = PDFLib;
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList  = document.getElementById('file-list');
const mergeBtn  = document.getElementById('merge-btn');
const statusDiv = document.getElementById('status');
let selectedFiles = [];

function updateFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <i class="fa-solid fa-grip-lines handle text-gray-500"></i>
      <i class="fa-solid fa-file-pdf text-red-400"></i>
      <span>${file.name}</span>
    `;
    fileList.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  new Sortable(fileList, {
    handle: '.handle', animation: 150,
    onEnd: evt => {
      const [moved] = selectedFiles.splice(evt.oldIndex, 1);
      selectedFiles.splice(evt.newIndex, 0, moved);
    }
  });
});

['dragenter','dragover','dragleave','drop'].forEach(e =>
  dropZone.addEventListener(e, ev => ev.preventDefault())
);

dropZone.addEventListener('drop', ev => {
  selectedFiles = Array.from(ev.dataTransfer.files)
                       .filter(f => f.type === 'application/pdf');
  updateFileList();
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', ev => {
  selectedFiles = Array.from(ev.target.files);
  updateFileList();
});

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
