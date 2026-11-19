
/* ====== إعدادات: عدّل هنا بس ====== */
const CONFIG = {
  SUPABASE_URL: "https://fnoinnwtwnypooiiqtuv.supabase.co",
  SUPABASE_KEY: "sb_publishable_4V_wiNmgb3mx1eaVCDPfQA_YrBIXH9l",
  WALLET_NUMBER: "[رقم المحفظة]",
  SUPPORT_PHONE: "",
  SUPPORT_WHATSAPP: "",
  // سعر الكرسي لكل وجهة بالجنيه
  PRICES: {}
};
/* ================================== */

const CITIES=['أسيوط','أسيوط الجديدة','ديروط','القوصية','منفلوط','أبنوب','الفتح','ساحل سليم','البداري','صدفا','أبو تيج','الغنايم','منقباد','بني مر','الوليدية','الحمام','عرب العوامر','نزلة عبد اللاه'];
const WALLETS=['فودافون كاش','اتصالات كاش','أورنج كاش','إنستا باي'];
const LAYOUT=[['D',1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14]];

const $=id=>document.getElementById(id);
let seats=[],pay='',step2=false,sending=false;

['from','to'].forEach(id=>{
  $(id).innerHTML='<option value="">اختار مدينة أو قرية</option>'+
    CITIES.map(c=>`<option>${c}</option>`).join('');
});

const d=new Date();
$('date').min=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

$('cPhone').textContent=CONFIG.SUPPORT_PHONE||'سيتم إضافته قريبًا';
$('cWa').textContent=CONFIG.SUPPORT_WHATSAPP||'سيتم إضافة الرقم قريبًا';

$('rows').innerHTML=LAYOUT.map(r=>
  '<div class="row">'+r.map(v=>
    `<div class="cell">${
      v==='D'
      ? '<div class="drv">السواق</div>'
      : `<button type="button" class="seat" data-s="${v}" aria-pressed="false" aria-label="كرسي رقم ${v}">${v}</button>`
    }</div>`
  ).join('')+'</div>'
).join('');

$('rows').addEventListener('click',e=>{
  const b=e.target.closest('.seat');
  if(!b)return;

  const n=+b.dataset.s;
  seats=seats.includes(n)
    ? seats.filter(x=>x!==n)
    : [...seats,n].sort((a,b)=>a-b);

  b.classList.toggle('on');
  b.setAttribute('aria-pressed',seats.includes(n));
  reset();
});

$('pay').innerHTML=WALLETS.map(w=>`<button type="button">${w}</button>`).join('');

$('pay').addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b)return;

  pay=b.textContent;

  [...$('pay').children].forEach(x=>
    x.classList.toggle('on',x===b)
  );

  $('done').classList.add('hide');
});

$('f').addEventListener('input',reset);

const v=id=>$(id).value.trim();
const unit=()=>CONFIG.PRICES[v('to')];
const total=()=>unit()&&seats.length?unit()*seats.length:0;

function reset(){
  $('done').classList.add('hide');
  refresh();
}

function refresh(){
  $('seatLabel').textContent=seats.length
    ? (seats.length>1?'كراسي رقم ':'كرسي رقم ')+seats.join('، ')+' ('+seats.length+')'
    : 'لسه ماختارتش';

  $('summary').textContent=
    `الاسم: ${v('name')}\n`+
    `التليفون: ${v('phone')}\n`+
    `الرحلة: من ${v('from')} إلى ${v('to')}\n`+
    `الموعد: ${v('date')} الساعة ${v('time')}\n`+
    `الكراسي: ${seats.join('، ')} (${seats.length})`;
}

function validate(needPay){
  if(!v('from')||!v('to'))return'من فضلك اختار مدينة التحرك والوصول.';
  if(v('from')===v('to'))return'مكان التحرك والوصول لازم يكونوا مختلفين.';
  if(!v('date'))return'من فضلك حدد تاريخ التحرك.';
  if(!v('time'))return'من فضلك حدد وقت التحرك.';
  if(!v('name'))return'من فضلك اكتب اسمك.';
  if(!/^01\d{9}$/.test(v('phone')))return'اكتب رقم تليفون صحيح من ١١ رقم يبدأ بـ 01.';
  if(!seats.length)return'من فضلك اختار كرسي واحد على الأقل من شكل العربية.';
  if(needPay&&!pay)return'من فضلك اختار طريقة الدفع.';
  return'';
}

function showErr(m){
  $('err').textContent=m;
  $('err').classList.toggle('hide',!m);
}

$('confirm').onclick=()=>{
  const m=validate(false);
  showErr(m);
  if(m)return;

  refresh();
  step2=true;
  $('step2').classList.remove('hide');
  $('step2').style.display='flex';
  $('confirm').classList.add('hide');
  $('submit').classList.remove('hide');
};

/* ====== إرسال الحجز إلى Supabase ====== */
$('submit').onclick=async()=>{
  const m=validate(true);
  showErr(m);
  if(m||sending)return;

  const order={
    name:v('name'),
    phone:v('phone'),
    from:v('from'),
    to:v('to'),
    date:v('date'),
    time:v('time'),
    seats:seats.join('، '),
    count:seats.length,
    payment:pay
  };

  sending=true;
  $('submit').textContent='جاري الإرسال...';
  $('submit').disabled=true;

  try{
    const booking={
      customer_name:order.name,
      phone:order.phone,
      trip_from:order.from,
      trip_to:order.to,
      travel_date:order.date,
      travel_time:order.time,
      seat_number:order.seats,
      price:total(),
      payment_method:order.payment
    };

    const response=await fetch(
      CONFIG.SUPABASE_URL+'/rest/v1/bookings',
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'apikey':CONFIG.SUPABASE_KEY,
          'Prefer':'return=minimal'
        },
        body:JSON.stringify(booking)
      }
    );

    if(!response.ok){
      const errorText=await response.text();
      console.error('Supabase error:',errorText);
      throw new Error(errorText);
    }

    $('done').textContent=
      `شكرًا يا ${order.name}، استلمنا طلب حجزك `+
      `(${order.count} كرسي: ${order.seats} من ${order.from} إلى ${order.to} `+
      `يوم ${order.date} الساعة ${order.time}، الدفع عن طريق ${order.payment}). `+
      `هيتم التواصل معاك على رقم ${order.phone} في أقرب وقت.`;

    $('done').classList.remove('hide');
    showErr('');

  }catch(e){
    console.error(e);
    showErr('حصلت مشكلة في إرسال الحجز، حاول تاني أو كلم خدمة العملاء.');
  }finally{
    sending=false;
    $('submit').disabled=false;
    $('submit').textContent='إتمام الحجز والدفع';
  }
};

/* ====== شرح الحجز ====== */
const VT=[
  ['اختار مكان التحرك','دوس على خانة "من"، واختار البلد اللي هتتحرك منها.'],
  ['اختار وجهتك','دوس على خانة "إلى"، واختار البلد اللي رايحها.'],
  ['حدد اليوم والوقت','اختار تاريخ السفر، وبعدين ميعاد التحرك اللي يناسبك.'],
  ['اكتب اسمك وتليفونك','اكتب اسمك، ورقم تليفونك اللي هنتصل بيك عليه.'],
  ['اختار كرسيك','دوس على الكرسي اللي عايزه من شكل العربية. ممكن تختار أكتر من كرسي.'],
  ['راجع بياناتك','دوس على زر تأكيد البيانات، وراجع كل حاجة كتبتها.'],
  ['ادفع وخلاص','اختار المحفظة اللي هتدفع بيها وحوّل المبلغ، وبعدها هنتصل بيك.']
];

const VF=[
  ['من','أسيوط'],
  ['إلى','ديروط'],
  ['التاريخ والوقت','٢٠ نوفمبر، الساعة ٨:٠٠ ص'],
  ['الاسم والتليفون','اسمك، 01XXXXXXXXX']
];

let vi=0,vPlaying=false,vVoice=false,vTimer=null;

$('vDots').innerHTML=VT.map((_,k)=>
  `<button type="button" class="d" data-k="${k}" aria-label="خطوة ${k+1}"></button>`
).join('');

function vSpeak(){
  try{
    const w=window.speechSynthesis;
    if(!w)return;
    w.cancel();
    const u=new SpeechSynthesisUtterance(VT[vi][0]+'. '+VT[vi][1]);
    u.lang='ar-EG';
    u.rate=.9;
    w.speak(u);
  }catch(e){}
}

function vStop(){
  try{window.speechSynthesis.cancel();}catch(e){}
}

function vRender(){
  $('vNum').textContent=vi+1;
  $('vTitle').textContent=VT[vi][0];
  $('vText').textContent=VT[vi][1];
  $('vBar').style.width=Math.round((vi+1)/7*100)+'%';

  [...$('vDots').children].forEach((d,k)=>
    d.classList.toggle('on',k===vi)
  );

  let h='';

  if(vi<4){
    h=`<div class="vf"><div>${VF[vi][0]}</div><div class="val pulse">${VF[vi][1]}</div></div>`;
  }else if(vi===4){
    h='<div class="ms">'+
      Array.from({length:14},(_,k)=>
        `<i class="${k===4||k===5?'on pulse':''}"></i>`
      ).join('')+
      '</div><div style="font-weight:600;text-align:center">دوس على الكرسي اللي عايزه (ممكن أكتر من كرسي)</div>';
  }else if(vi===5){
    h='<div class="vbtn pulse">تأكيد البيانات</div>';
  }else{
    h='<div class="vw"><span class="on pulse">فودافون كاش</span><span>اتصالات كاش</span><span>أورنج كاش</span><span>إنستا باي</span></div>';
  }

  $('vPanel').innerHTML=h;
  $('vPlay').textContent=vPlaying?'إيقاف الشرح':(vi===0?'▶ شغّل الشرح':'▶ كمّل الشرح');
  $('vVoice').textContent=vVoice?'الصوت: شغال':'الصوت: مقفول (دوس عشان تسمع)';
}

function vGo(k){
  vi=(k+7)%7;
  vRender();
  if(vVoice)vSpeak();
}

$('vPlay').onclick=()=>{
  vPlaying=!vPlaying;
  clearInterval(vTimer);

  if(vPlaying){
    vTimer=setInterval(()=>vGo(vi+1),7000);
    if(vVoice)vSpeak();
  }else{
    vStop();
  }

  vRender();
};

$('vVoice').onclick=()=>{
  vVoice=!vVoice;
  if(vVoice)vSpeak();
  else vStop();
  vRender();
};

$('vPrev').onclick=()=>vGo(vi-1);
$('vNext').onclick=()=>vGo(vi+1);

$('vDots').onclick=e=>{
  const b=e.target.closest('.d');
  if(b)vGo(+b.dataset.k);
};

vRender();
