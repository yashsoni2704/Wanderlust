// Navbar search pill behaviors
(function(){
    const whereInput = document.getElementById('whereInput');
    const whereValue = document.getElementById('whereValue');
    const useLocationBtn = document.getElementById('useLocationBtn');
    const adultsCount = document.getElementById('adultsCount');
    const childrenCount = document.getElementById('childrenCount');
    const infantsCount = document.getElementById('infantsCount');
    const guestsValue = document.getElementById('guestsValue');
    const whenValue = document.getElementById('whenValue');

    if (whereInput && whereValue) {
        whereInput.addEventListener('input', () => {
            whereValue.textContent = whereInput.value || 'Search destinations';
        });
    }

    if (useLocationBtn && whereValue) {
        useLocationBtn.addEventListener('click', async () => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}` , {
                        headers: { 'User-Agent': 'Wanderlust-Travel-App' }
                    });
                    const data = await resp.json();
                    const label = data.address && (data.address.city || data.address.town || data.address.village || data.address.state) || 'Current location';
                    whereValue.textContent = label;
                } catch (e) {
                    console.error('Geolocation reverse lookup failed', e);
                    whereValue.textContent = 'Current location';
                }
            });
        });
    }

    function updateGuestsLabel(){
        if (!guestsValue) return;
        const a = parseInt(adultsCount?.textContent||'0',10);
        const c = parseInt(childrenCount?.textContent||'0',10);
        const i = parseInt(infantsCount?.textContent||'0',10);
        const total = a + c + i;
        guestsValue.textContent = total > 0 ? `${total} guest${total>1?'s':''}` : 'Add guests';
    }

    function attachGuestButtons(){
        document.querySelectorAll('.guest-plus').forEach(btn=>{
            btn.addEventListener('click',()=>{
                const target = btn.getAttribute('data-target');
                const el = document.getElementById(`${target}Count`);
                el.textContent = String(parseInt(el.textContent,10)+1);
                updateGuestsLabel();
            });
        });
        document.querySelectorAll('.guest-minus').forEach(btn=>{
            btn.addEventListener('click',()=>{
                const target = btn.getAttribute('data-target');
                const el = document.getElementById(`${target}Count`);
                el.textContent = String(Math.max(0, parseInt(el.textContent,10)-1));
                updateGuestsLabel();
            });
        });
    }

    attachGuestButtons();

    // Submit search form with hidden inputs
    const searchForm = document.querySelector('.search-pill-wrapper form.search-pill');
    function totalGuests(){
        const a = parseInt(adultsCount?.textContent||'0',10);
        const c = parseInt(childrenCount?.textContent||'0',10);
        const i = parseInt(infantsCount?.textContent||'0',10);
        return a + c + i;
    }
    if (searchForm) {
        searchForm.addEventListener('submit', (e)=>{
            // Ensure hidden inputs reflect current UI
            const ensureHidden = (name, val)=>{
                if (val==null || val==='') return;
                let el = searchForm.querySelector(`input[name="${name}"]`);
                if (!el) {
                    el = document.createElement('input');
                    el.type = 'hidden';
                    el.name = name;
                    searchForm.appendChild(el);
                }
                el.value = val;
            };
            ensureHidden('where', whereInput?.value || whereValue?.textContent || '');
            ensureHidden('checkIn', document.getElementById('checkIn')?.value || '');
            ensureHidden('checkOut', document.getElementById('checkOut')?.value || '');
            ensureHidden('guests', String(totalGuests()));
        });

        // Live update: apply only when all 3 set (where, both dates, guests)
        const renderWhenValue = ()=>{
            const ci = document.getElementById('checkIn')?.value;
            const co = document.getElementById('checkOut')?.value;
            if (whenValue) {
                if (ci && co) {
                    const a = new Date(ci), b = new Date(co);
                    whenValue.textContent = `${a.toLocaleDateString(undefined,{month:'short',day:'numeric'})} - ${b.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
                } else {
                    whenValue.textContent = 'Add dates';
                }
            }
        };
        const readyToFilter = ()=>{
            const whereReady = (whereInput?.value || whereValue?.textContent || '').trim().length>0 && (whereValue?.textContent !== 'Search destinations' || (whereInput?.value||'').length>0);
            const ci = document.getElementById('checkIn')?.value;
            const co = document.getElementById('checkOut')?.value;
            return whereReady && ci && co && totalGuests()>0;
        };
        const triggerSubmit = ()=> { if (readyToFilter()) searchForm.requestSubmit(); };
        const debounce = (fn, ms)=>{ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(null,args), ms); }; };
        const debouncedSubmitGuests = debounce(triggerSubmit, 700);
        whereInput && whereInput.addEventListener('change', triggerSubmit);
        const updateAvailability = async ()=>{
            const ci = document.getElementById('checkIn')?.value;
            const co = document.getElementById('checkOut')?.value;
            const availabilityEl = document.getElementById('roomsAvailability');
            const listingId = window.location.pathname.match(/listings\/(\w+)/)?.[1];
            if (!availabilityEl || !listingId || !ci || !co) return;
            try {
                const resp = await fetch(`/listings/${listingId}/availability?checkIn=${ci}&checkOut=${co}`);
                const data = await resp.json();
                if (data && typeof data.roomsLeft !== 'undefined') {
                    availabilityEl.textContent = `Available for selected dates: ${data.roomsLeft}`;
                    availabilityEl.className = `small ${data.roomsLeft===0 ? 'text-danger':'text-muted'}`;
                }
            } catch {}
        };
        document.getElementById('checkIn')?.addEventListener('change', ()=>{ renderWhenValue(); updateAvailability(); triggerSubmit(); });
        document.getElementById('checkOut')?.addEventListener('change', ()=>{ renderWhenValue(); updateAvailability(); triggerSubmit(); });
        document.querySelectorAll('.guest-plus,.guest-minus').forEach(btn=> btn.addEventListener('click', ()=>{
            updateGuestsLabel();
            debouncedSubmitGuests();
        }));
        useLocationBtn && useLocationBtn.addEventListener('click', ()=> setTimeout(triggerSubmit, 600));

        // Search click focuses missing section if not ready
        const searchBtn = searchForm.querySelector('.search-btn');
        searchBtn && searchBtn.addEventListener('click', (e)=>{
            if (!readyToFilter()) {
                e.preventDefault();
                if (!((whereInput?.value||'').trim().length>0 || (whereValue?.textContent||'')!=='Search destinations')) { document.getElementById('whereBtn')?.click(); return; }
                const ci = document.getElementById('checkIn')?.value; const co = document.getElementById('checkOut')?.value;
                if (!(ci && co)) { document.getElementById('whenBtn')?.click(); return; }
                if (totalGuests()===0) { document.getElementById('whoBtn')?.click(); return; }
            }
        });
    }

    // Unified panel switching
    const whereBtn = document.getElementById('whereBtn');
    const whenBtn = document.getElementById('whenBtn');
    const whoBtn = document.getElementById('whoBtn');
    const whereSection = document.getElementById('whereSection');
    const whenSection = document.getElementById('whenSection');
    const whoSection = document.getElementById('whoSection');
    const searchWrapper = document.getElementById('searchWrapper');
    const searchPanel = document.getElementById('searchPanel');
    const monthHeading = document.getElementById('monthHeading');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const qpToday = document.getElementById('qpToday');
    const qpTomorrow = document.getElementById('qpTomorrow');
    const qpWeekend = document.getElementById('qpWeekend');
    const qpTodayLabel = document.getElementById('qpTodayLabel');
    const qpTomorrowLabel = document.getElementById('qpTomorrowLabel');
    const qpWeekendLabel = document.getElementById('qpWeekendLabel');

    function showSection(section){
        [whereSection, whenSection, whoSection].forEach(s=> s && s.classList.add('d-none'));
        section && section.classList.remove('d-none');
    }

    function openPanel(section){
        if (!searchWrapper) return;
        searchWrapper.classList.add('open');
        showSection(section);
    }
    function closePanel(){
        if (!searchWrapper) return;
        searchWrapper.classList.remove('open');
    }

    if (whereBtn) whereBtn.addEventListener('click', ()=> openPanel(whereSection));
    if (whenBtn) whenBtn.addEventListener('click', ()=> openPanel(whenSection));
    if (whoBtn) whoBtn.addEventListener('click', ()=> openPanel(whoSection));

    // Click outside to close
    document.addEventListener('click', (e)=>{
        if (!searchWrapper) return;
        if (searchWrapper.contains(e.target)) return; // inside
        closePanel();
    });

    // Prevent click inside panel from bubbling to document
    if (searchPanel) {
        searchPanel.addEventListener('click', (e)=> e.stopPropagation());
    }

    // Date quick picks and header
    function formatDate(d){
        return d.toLocaleDateString(undefined, { day:'numeric', month:'long' });
    }
    function setInputDate(input, date){
        const y = date.getFullYear();
        const m = String(date.getMonth()+1).padStart(2,'0');
        const da = String(date.getDate()).padStart(2,'0');
        input.value = `${y}-${m}-${da}`;
    }
    function updateMonthHeading(){
        const base = checkIn?.value ? new Date(checkIn.value) : new Date();
        monthHeading && (monthHeading.textContent = base.toLocaleDateString(undefined,{ month:'long', year:'numeric'}));
    }
    function initQuickPickLabels(){
        const today = new Date();
        const tomorrow = new Date(Date.now() + 24*60*60*1000);
        // find next Saturday for weekend
        const weekend = new Date(today);
        const day = weekend.getDay();
        const delta = (6 - day + 7) % 7; // days to Saturday
        weekend.setDate(weekend.getDate() + delta);
        qpTodayLabel && (qpTodayLabel.textContent = formatDate(today));
        qpTomorrowLabel && (qpTomorrowLabel.textContent = formatDate(tomorrow));
        qpWeekendLabel && (qpWeekendLabel.textContent = formatDate(weekend));
    }
    function clearQuickActive(){
        [qpToday, qpTomorrow, qpWeekend].forEach(el=> el && el.classList.remove('active'));
    }
    function useQuickPick(range){
        const today = new Date();
        if (range==='today'){
            setInputDate(checkIn, today);
            const out = new Date(today); out.setDate(out.getDate()+1);
            setInputDate(checkOut, out);
            clearQuickActive(); qpToday && qpToday.classList.add('active');
        }
        if (range==='tomorrow'){
            const start = new Date(Date.now()+24*60*60*1000);
            setInputDate(checkIn, start);
            const out = new Date(start); out.setDate(out.getDate()+1);
            setInputDate(checkOut, out);
            clearQuickActive(); qpTomorrow && qpTomorrow.classList.add('active');
        }
        if (range==='weekend'){
            const start = new Date();
            const day = start.getDay();
            const delta = (6 - day + 7) % 7; // to Saturday
            start.setDate(start.getDate()+delta);
            const out = new Date(start); out.setDate(out.getDate()+2); // Sat-Mon checkout
            setInputDate(checkIn, start);
            setInputDate(checkOut, out);
            clearQuickActive(); qpWeekend && qpWeekend.classList.add('active');
        }
        updateMonthHeading();
    }

    // Wire quick picks
    qpToday && qpToday.addEventListener('click', ()=> { useQuickPick('today'); document.getElementById('checkIn')?.dispatchEvent(new Event('change')); });
    qpTomorrow && qpTomorrow.addEventListener('click', ()=> { useQuickPick('tomorrow'); document.getElementById('checkIn')?.dispatchEvent(new Event('change')); });
    qpWeekend && qpWeekend.addEventListener('click', ()=> { useQuickPick('weekend'); document.getElementById('checkIn')?.dispatchEvent(new Event('change')); });

    // Month nav just updates heading based on current inputs
    prevMonthBtn && prevMonthBtn.addEventListener('click', ()=>{
        const base = checkIn?.value ? new Date(checkIn.value) : new Date();
        base.setMonth(base.getMonth()-1);
        monthHeading && (monthHeading.textContent = base.toLocaleDateString(undefined,{ month:'long', year:'numeric'}));
    });
    nextMonthBtn && nextMonthBtn.addEventListener('click', ()=>{
        const base = checkIn?.value ? new Date(checkIn.value) : new Date();
        base.setMonth(base.getMonth()+1);
        monthHeading && (monthHeading.textContent = base.toLocaleDateString(undefined,{ month:'long', year:'numeric'}));
    });

    initQuickPickLabels();
    updateMonthHeading();
    // initialize When label
    (function(){
        const ci = document.getElementById('checkIn')?.value;
        const co = document.getElementById('checkOut')?.value;
        if (ci && co && whenValue){
            const a = new Date(ci), b = new Date(co);
            whenValue.textContent = `${a.toLocaleDateString(undefined,{month:'short',day:'numeric'})} - ${b.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
        }
    })();
})();
// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()