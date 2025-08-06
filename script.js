const { PDFDocument } = PDFLib;
const dropZone     = document.getElementById('drop-zone');
const fileInput    = document.getElementById('file-input');
const fileList     = document.getElementById('file-list');
const mergeBtn     = document.getElementById('merge-btn');
const statusDiv    = document.getElementById('status');
const totalPagesEl = document.getElementById('total-pages');
const carousel     = document.getElementById('carousel-container');
const scrollLeft   = document.getElementById('scroll-left');
const scrollRight  = document.getElementById('scroll-right');
let selectedFiles  = [];

function createPreviewObject(file) {
  const url = URL.createObjectURL(file);
  const embed = document.createElement('object');
  embed.type = 'application/pdf';
  embed.data = url;
  embed.width = 100;
  embed.height = 140;
  return embed;
}

async function getPageCount(file) {
  const buf = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buf);
  return pdf.getPageCount();
}

async function updateFileList() {
  fileList.innerHTML = '';
  let total = 0;
  for (const [i, file] of selectedFiles.entries()) {
    const pages = await getPageCount(file);
    total += pages;
    const li = document.createElement('li');
    li.classList.add('animate__animated','animate__fadeInUp');
    const handle = document.createElement('i');
    handle.className = 'fa-solid fa-grip-lines handle';
    const preview = createPreviewObject(file);
    const info = document.createElement('p');
    info.className = 'info';
    info.textContent = `${file.name} (${pages} halaman)`;
    const btnL = document.createElement('div');
    btnL.className = 'move-btn move-left';
    btnL.innerHTML = '<i class="fas fa-arrow-left"></i>';
    btnL.onclick = () => moveItem(i, i-1);
    const btnR = document.createElement('div');
    btnR.className = 'move-btn move-right';
    btnR.innerHTML = '<i class="fas fa-arrow-right"></i>';
    btnR.onclick = () => moveItem(i, i+1);
    li.append(handle, preview, info, btnL, btnR);
    fileList.appendChild(li);
  }
  totalPagesEl.textContent = `Total halaman: ${total}`;
}

function moveItem(oldIdx, newIdx) {
  if (newIdx < 0 || newIdx >= selectedFiles.length) return;
  const [m] = selectedFiles.splice(oldIdx, 1);
  selectedFiles.splice(newIdx, 0, m);
  updateFileList();
}

document.addEventListener('DOMContentLoaded', () => {
  new Sortable(fileList, { direction: 'horizontal', handle: '.handle', animation: 200, onEnd(evt) { moveItem(evt.oldIndex, evt.newIndex); } });
  scrollLeft.addEventListener('click', () => carousel.scrollBy({ left: -200, behavior: 'smooth' }));
  scrollRight.addEventListener('click', () => carousel.scrollBy({ left: 200, behavior: 'smooth' }));
});

dropZone.addEventListener('click', () => fileInput.click());
['dragenter','dragover','dragleave','drop'].forEach(e => dropZone.addEventListener(e, ev => ev.preventDefault()));
dropZone.addEventListener('drop', e => {
  selectedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
  updateFileList();
});
fileInput.addEventListener('change', e => { selectedFiles = Array.from(e.target.files); updateFileList(); });

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
  const a      = document.createElement('a'); a.href = url; a.download = 'merged.pdf'; a.click();
  statusDiv.textContent = 'Selesai! File telah diunduh.';
});
