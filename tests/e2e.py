"""PaperMind end-to-end browser test.

Usage:
  1. Serve the project folder, e.g.  python -m http.server 8000
  2. pip install playwright  &&  python -m playwright install chromium
  3. python tests/e2e.py            (or: PAPERMIND_URL=http://localhost:5500/ python tests/e2e.py)
"""
import asyncio, re, os, sys
from playwright.async_api import async_playwright, expect
BASE=os.environ.get('PAPERMIND_URL','http://localhost:8000/').rstrip('/')+'/'
log=[]
def ok(c,msg):
    log.append(('PASS' if c else 'FAIL')+' · '+msg)
async def toasts(pg):
    return await pg.eval_on_selector_all('.toast .t-title','els=>els.map(e=>e.textContent)')
async def confirm(pg):
    await pg.click('.modal [data-ok]'); await pg.wait_for_timeout(150)
async def login(pg, role, u, p):
    await pg.goto(BASE+'index.html')
    if role=='teacher': await pg.click('.role-option[data-role=teacher]')
    await pg.fill('#login-id',u); await pg.fill('#login-secret',p); await pg.click('#login-submit')
    await pg.wait_for_url('**/'+('teacher' if role=='teacher' else 'student')+'.html*')
async def logout(pg):
    if await pg.is_visible('.menu-toggle'): await pg.click('.menu-toggle'); await pg.wait_for_timeout(250)
    await pg.click('[data-action=logout]'); await confirm(pg); await pg.wait_for_url('**/index.html*')
async def main():
    async with async_playwright() as p:
        opts={'executable_path':os.environ['CHROME_PATH']} if os.environ.get('CHROME_PATH') else {}
        b=await p.chromium.launch(headless=os.environ.get('HEADED')!='1', **opts)
        ctx=await b.new_context(viewport={'width':1440,'height':900})
        pg=await ctx.new_page()
        errs=[]
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'fonts.g' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE+'index.html'); await pg.evaluate('localStorage.clear()'); await pg.goto(BASE+'index.html')
        # ---- A. login validation
        await pg.click('#login-submit')
        ok(await pg.locator('.error-text').count()==2,'empty login shows 2 field errors')
        await pg.fill('#login-id','salma.ahmed'); await pg.fill('#login-secret','9999'); await pg.click('#login-submit')
        ok('PIN is not right' in (await pg.text_content('.error-text')),'wrong PIN shows friendly error')
        await pg.click('.role-option[data-role=teacher]'); await pg.fill('#login-id','nope'); await pg.fill('#login-secret','x'); await pg.click('#login-submit')
        ok('email' in (await pg.text_content('.error-text')),'teacher invalid email validated')
        # guard: direct access to teacher.html without login
        await pg.goto(BASE+'teacher.html'); await pg.wait_for_url('**/index.html*'); ok(True,'teacher.html redirects to login when logged out')
        # ---- B. student upload
        await login(pg,'student','salma.ahmed','1234')
        ok(await pg.locator('.nav a[aria-current=page]').inner_text()=='Home','student lands on Home')
        await pg.click('.big-card.bc-green'); await pg.wait_for_timeout(200)
        await pg.click('[data-action=use-sample]'); await pg.wait_for_timeout(200)
        await pg.select_option('#u-subject','Math'); await pg.select_option('#u-title','__other')
        await pg.click('form[data-form=upload] button[type=submit]')
        ok('Please type the name' in (await pg.text_content('.error-text')),'upload: other exam name required')
        await pg.fill('#u-other','Math Quiz 5'); await pg.click('form[data-form=upload] button[type=submit]')
        ok('One more check!' in await toasts(pg),'upload: checkbox error prevention')
        await pg.check('#u-check'); await pg.click('form[data-form=upload] button[type=submit]'); await pg.wait_for_timeout(200)
        ok(await pg.locator('.success h2').count()==1,'upload success screen shown')
        ok(any('uploaded' in t for t in await toasts(pg)),'upload success toast')
        await pg.click('text=See My Exams'); await pg.wait_for_timeout(200)
        txt=await pg.inner_text('#view')
        ok('Math Quiz 5' in txt and 'UNDER REVIEW' in txt and '%' not in txt.split('Math Quiz 5')[1][:80],'new exam is Under Review without grade')
        # file type validation
        await pg.goto(BASE+'student.html#/upload'); await pg.wait_for_timeout(150)
        await pg.set_input_files('#file-in', files=[{'name':'notes.txt','mimeType':'text/plain','buffer':b'hello'}]); await pg.wait_for_timeout(200)
        ok(await pg.locator('#file-err .notice').count()==1,'wrong file type rejected with message')
        await logout(pg)
        ok(pg.url.endswith('index.html'),'student logout returns to login')
        # ---- C. teacher
        await login(pg,'teacher','sarah.educator@papermind.school','teacher123')
        dash=await pg.inner_text('#view'); ok('Good' in dash and 'Ms. Sarah' in dash,'teacher dashboard greeting')
        ok('Salma Ahmed' in dash and 'Math Quiz 5' in dash,'student upload appears in teacher attention list')
        # class dropdown
        await pg.click('button[aria-controls=class-menu]'); ok(await pg.is_visible('#class-menu'),'class dropdown opens')
        await pg.click('#class-menu [data-id="4B"]'); await pg.wait_for_timeout(200)
        await pg.goto(BASE+'teacher.html#/submissions'); await pg.wait_for_timeout(200)
        s4b=await pg.inner_text('#sub-list'); ok('Mia Schmidt' in s4b and 'Salma' not in s4b,'class switch changes submissions (4B)')
        await pg.click('button[aria-controls=class-menu]'); await pg.click('#class-menu [data-id="4A"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-action=sub-filter][data-f=ocr]'); await pg.wait_for_timeout(200)
        cards=await pg.locator('#sub-list .sub-card').count(); ok(cards==3,'Needs OCR filter shows 3 exams (got %d)'%cards)
        await pg.fill('#sub-search','noah'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#sub-list .sub-card').count()==1,'search filters by student name')
        await pg.fill('#sub-search','zzz'); await pg.wait_for_timeout(100)
        ok(await pg.locator('#sub-list .empty').count()==1,'empty search shows recovery state')
        await pg.click('[data-action=clear-sub-filters]'); await pg.wait_for_timeout(150)
        # grading Salma quiz 3
        await pg.goto(BASE+'teacher.html#/grading/ex-salma-q3'); await pg.wait_for_timeout(200)
        await pg.click('[data-action=goto-step][data-step="3"]', force=True)
        ok(any('locked' in t for t in await toasts(pg)),'locked step shows warning')
        await pg.click('[data-action=run-ai]', force=True)
        ok(any('can’t start' in t for t in await toasts(pg)),'AI grading blocked until OCR resolved')
        await pg.click('.paper-line >> nth=3'); await pg.wait_for_timeout(300)
        ok(await pg.locator('#ocrq-q4.flash').count()==1,'click scan line highlights extracted answer')
        await pg.click('[data-action=ocr-pick][data-v="9/4"]'); await pg.click('[data-action=ocr-resolve][data-q=q4]'); await pg.wait_for_timeout(150)
        ok(any('OCR correction saved' in t for t in await toasts(pg)),'OCR reading confirmed toast')
        await pg.fill('#ocr-v-q1','3/4'); # unchanged
        await pg.click('[data-action=run-ai]'); await pg.wait_for_timeout(1400)
        v=await pg.inner_text('#view'); ok('74%' in v and 'Step 2 of 4' in v,'AI grading shows 74% at step 2')
        await pg.click('[data-action=to-step3]'); await pg.wait_for_timeout(200)
        await pg.click('[data-action=confirm-grade]')
        ok(any('decision' in t for t in await toasts(pg)),'confirm blocked while decisions left')
        await pg.fill('#pts-q4','6'); await pg.wait_for_timeout(100)
        ok(await pg.is_visible('#reason-row-q4'),'override shows reason field')
        ok((await pg.inner_text('#final-grade'))=='78%','final grade updates live (78%)')
        for sel in ['[data-action=decide][data-kind=gap][data-v=confirmed]','[data-action=decide][data-kind=rec][data-v=confirmed]']:
            n=await pg.locator(sel).count()
            for i in range(n):
                await pg.locator(sel).nth(i).click(); await pg.wait_for_timeout(80)
        await pg.click('[data-action=decide][data-kind=flag][data-v=confirmed]'); await pg.wait_for_timeout(100)
        ok('All decisions made' in await pg.inner_text('#dec-left'),'all decisions made')
        await pg.click('[data-action=confirm-grade]'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#reason-q4[aria-invalid=true]').count()==1,'missing override reason flagged')
        await pg.fill('#reason-q4','Correct value, partial credit for conversion attempt')
        await pg.fill('#fb','Great job on the fraction calculations, Salma! 🌟 “bleibt übrig” means what is LEFT. Let’s practise together.')
        await pg.click('[data-action=goto-step][data-step="2"]'); await pg.wait_for_timeout(150)
        await pg.click('[data-action=to-step3]'); await pg.wait_for_timeout(150)
        ok(await pg.input_value('#pts-q4')=='6' and 'LEFT' in await pg.input_value('#fb'),'back/forward keeps teacher edits')
        await pg.click('[data-action=confirm-grade]'); await pg.wait_for_timeout(200)
        ok(any('confirmed' in t for t in await toasts(pg)),'grade confirmed toast; step 4')
        await pg.select_option('#att-practice','p2'); await pg.wait_for_timeout(150)
        pv=await pg.inner_text('#view'); ok('78%' in pv and 'Extra help' in pv,'student preview shows grade + kind red flag')
        await pg.click('[data-action=publish]'); await confirm(pg); await pg.wait_for_timeout(200)
        ok(any('published' in t.lower() for t in await toasts(pg)),'publish toast')
        ok('Published' in await pg.inner_text('#view'),'published summary view')
        # learning gaps: group + language decision
        await pg.goto(BASE+'teacher.html#/gaps'); await pg.wait_for_timeout(200)
        await pg.click('[data-action=prefill-group] >> nth=0'); await pg.wait_for_timeout(150)
        await pg.fill('#g-name','Word Problem Helpers'); await pg.click('#g-submit'); await pg.wait_for_timeout(150)
        ok(any('Group created' in t for t in await toasts(pg)),'targeted group created')
        tbl=await pg.inner_text('#view'); ok('3×' in tbl,'recurring mistake table shows 3× after confirmation')
        await pg.select_option('#lang-student','s1'); await pg.wait_for_timeout(200)
        await pg.click('.radio-chips label:has-text("Both")'); await pg.click('[data-action=save-lang]', force=True); await pg.wait_for_timeout(150)
        ok(any('Decision saved for Salma Ahmed: Both' in t for t in await toasts(pg)),'language vs concept decision saved')
        # practice assignment
        await pg.goto(BASE+'teacher.html#/practice'); await pg.wait_for_timeout(150)
        await pg.click('form[data-form=assign-practice] button[type=submit]'); await pg.wait_for_timeout(100)
        ok(await pg.locator('form[data-form=assign-practice] .error-text').count()>=2,'practice form validation')
        await pg.select_option('#p-target','student:s1'); await pg.fill('#p-title','Times Table Rocket'); await pg.select_option('#p-gap','g-times')
        await pg.set_input_files('#p-file', files=[{'name':'sheet.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 test'}])
        await pg.click('form[data-form=assign-practice] button[type=submit]'); await pg.wait_for_timeout(200)
        ok('Times Table Rocket' in await pg.inner_text('#view'),'practice assignment created & listed')
        # session
        await pg.goto(BASE+'teacher.html#/sessions'); await pg.wait_for_timeout(150)
        gid=await pg.evaluate("PM.data.state.groups.find(g=>g.name==='Word Problem Helpers').id"); await pg.select_option('#s-group',gid)
        await pg.fill('#s-title','Friday Fraction Club'); await pg.fill('#s-cap','2'); await pg.click('form[data-form=create-session] button[type=submit]'); await pg.wait_for_timeout(100)
        ok(await pg.locator('#s-cap[aria-invalid=true]').count()==1,'capacity smaller than group rejected')
        await pg.fill('#s-cap','8'); await pg.click('form[data-form=create-session] button[type=submit]'); await pg.wait_for_timeout(200)
        ok('Friday Fraction Club' in await pg.inner_text('#view'),'support session created')
        # notification
        await pg.goto(BASE+'teacher.html#/notifications?to=s1'); await pg.wait_for_timeout(150)
        await pg.fill('#m-title','Super effort today!'); await pg.click('[data-action=quick-tag] >> nth=0'); await pg.click('form[data-form=send-message] button[type=submit]'); await pg.wait_for_timeout(200)
        ok('Super effort today!' in await pg.inner_text('#view'),'message sent & visible in Sent tab')
        # profile
        await pg.click('.profile-card'); await pg.fill('#tp-display',''); await pg.click('#tp-save')
        ok(await pg.locator('#tp-display[aria-invalid=true]').count()==1,'profile validation')
        await pg.fill('#tp-display','Ms. Sarah'); await pg.click('#tp-save'); await pg.wait_for_timeout(100)
        ok(any('Profile updated' in t for t in await toasts(pg)),'teacher profile saved')
        # help + insights + print button exists
        await pg.goto(BASE+'teacher.html#/insights'); await pg.wait_for_timeout(150)
        ins=await pg.inner_text('#view'); ok('OCR Quality' in ins and 'Red Flag Patterns' in ins and 'Weekly Weakness Trend' in ins,'insights sections render')
        await pg.keyboard.press('?'); await pg.wait_for_timeout(100); ok(await pg.locator('.drawer').count()==1,'? opens help drawer')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100); ok(await pg.locator('.drawer').count()==0,'Esc closes help')
        await logout(pg)
        # ---- D. student sees everything
        await login(pg,'student','salma.ahmed','1234')
        await pg.goto(BASE+'student.html#/notifications'); await pg.wait_for_timeout(200)
        nt=await pg.inner_text('#view')
        for k in ['New feedback: Math Quiz 3','New practice: Times Table Rocket','You are invited: Friday Fraction Club','Super effort today!']:
            ok(k in nt,'student notification: '+k)
        await pg.click('text=View Exam Result & Feedback >> nth=0'); await pg.wait_for_timeout(1500)
        r=await pg.inner_text('#view'); ok('78%' in r and 'LEFT' in r and 'Extra help is coming' in r,'student result shows confirmed grade, feedback, red flag')
        ok('German word problems' in r,'student sees confirmed learning gap')
        await pg.goto(BASE+'student.html#/exams'); await pg.wait_for_timeout(150)
        ok('Math Quiz 3' in await pg.inner_text('#view'),'Quiz 3 moved to Completed')
        # practice quiz
        await pg.goto(BASE+'student.html#/practice'); await pg.wait_for_timeout(150)
        await pg.click('#pc-p2 [data-action=open-practice]'); await pg.wait_for_timeout(150)
        await pg.click('[data-pa=quiz]'); await pg.wait_for_timeout(150)
        for i in range(5):
            await pg.click('.quiz-choice >> nth=0'); await pg.wait_for_timeout(60); await pg.click('#q-next'); await pg.wait_for_timeout(60)
        ok(await pg.locator('#q-done').count()==1,'quiz finished with score screen')
        await pg.click('#q-done'); await pg.wait_for_timeout(200)
        ok(any('Practice completed' in t for t in await toasts(pg)),'practice completed toast')
        # video lesson
        await pg.goto(BASE+'student.html#/practice?focus=p2'); await pg.wait_for_timeout(150)
        # sessions
        await pg.goto(BASE+'student.html#/sessions'); await pg.wait_for_timeout(150)
        n0=await pg.locator('[data-action=register]').count()
        await pg.click('[data-action=register] >> nth=0'); await confirm(pg); await pg.wait_for_timeout(150)
        ok(any('registration successful' in t for t in await toasts(pg)),'student registered for session')
        ok(await pg.locator('[data-action=register]').count()==n0-1,'register button replaced by registered state')
        # progress reflects new grade
        await pg.goto(BASE+'student.html#/progress'); await pg.wait_for_timeout(150)
        ok('78%' in await pg.inner_text('#view'),'progress chart includes new published grade')
        # student profile edit
        await pg.click('.profile-card'); await pg.click('#sp-edit'); await pg.click('[data-emo="🦄"]'); await pg.fill('#sp-nick','Sally'); await pg.click('#sp-close'); await pg.wait_for_timeout(150)
        await pg.goto(BASE+'student.html#/home'); await pg.wait_for_timeout(150)
        ok('Hi Sally' in await pg.inner_text('#view'),'student nickname saved and used')
        await logout(pg)
        # ---- E. teacher sees updates
        await login(pg,'teacher','sarah.educator@papermind.school','teacher123')
        await pg.goto(BASE+'teacher.html#/practice'); await pg.wait_for_timeout(150)
        pt=await pg.inner_html('#view'); ok('1 of 2 completed' in pt,'teacher sees Salma practice completion (1/2)')
        await pg.goto(BASE+'teacher.html#/sessions'); await pg.wait_for_timeout(150)
        ok('Registered · Salma Ahmed' in await pg.inner_text('#view'),'teacher sees Salma registration')
        await pg.goto(BASE+'teacher.html#/notifications?tab=inbox'); await pg.wait_for_timeout(150)
        ib=await pg.inner_text('#view'); ok('Salma Ahmed registered' in ib and 'Salma Ahmed completed practice' in ib and 'New exam from Salma Ahmed' in ib,'teacher inbox has cross-portal events')
        # every sidebar link
        for a in await pg.eval_on_selector_all('.nav a','els=>els.map(e=>e.getAttribute("href"))'):
            await pg.goto(BASE+'teacher.html'+a); await pg.wait_for_timeout(120)
            ok(await pg.locator('.nav a[aria-current=page]').get_attribute('href')==a,'teacher nav '+a)
        # mobile
        await pg.set_viewport_size({'width':390,'height':844}); await pg.goto(BASE+'teacher.html#/dashboard'); await pg.wait_for_timeout(200)
        await pg.click('.menu-toggle'); await pg.wait_for_timeout(250); await pg.screenshot(path='/tmp/m_teacher_nav.png')
        await pg.click('.nav a[href="#/submissions"]'); await pg.wait_for_timeout(250); await pg.screenshot(path='/tmp/m_teacher_sub.png')
        ok('Student Submissions' in await pg.inner_text('#view'),'mobile nav works')
        sw=await pg.evaluate('document.documentElement.scrollWidth'); ok(sw<=392,'no horizontal overflow on mobile teacher (%d)'%sw)
        await logout(pg)
        await login(pg,'student','omar.ali','1234')
        await pg.screenshot(path='/tmp/m_student_home.png', full_page=True)
        sw=await pg.evaluate('document.documentElement.scrollWidth'); ok(sw<=392,'no horizontal overflow on mobile student (%d)'%sw)
        for a in await pg.eval_on_selector_all('.nav a','els=>els.map(e=>e.getAttribute("href"))'):
            await pg.goto(BASE+'student.html'+a); await pg.wait_for_timeout(120)
            sw=await pg.evaluate('document.documentElement.scrollWidth')
            ok(sw<=392,'mobile student %s overflow %d'%(a,sw))
        print('\n'.join(log)); print('CONSOLE/PAGE ERRORS:', errs or 'none')
        failed=sum(1 for l in log if l.startswith('FAIL'))
        print('TOTAL', len(log), 'FAILED', failed)
        if failed or errs: sys.exit(1)
        await b.close()
asyncio.run(main())
