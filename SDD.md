User flow

1. hereglegch burtguulj orno ⇒ hereglegchiin oruulsan mailruu neg udaagiin nuuts ug yvuulj batalgaajuulna.
2. hereglegch uuriin duriig songono (characters) ene ni tsaashdiin hogjuuleltiin yvtsad nemer boloh zuils buguud quest iin category oos hamaarj xp bolon point tootsogdono.
3. burtguuleed nevtreed orsnii daraa dashboard heseg baih buguud lvl ranking progress bar, balance, oroltsoj bui aylaliin agenda, point shop, daily claim xp heseg haragdana.
4. quest ⇒ ene page dr questuud bairlah buguud dynamic baina. form bugluh, zurag avah, chec-in hiih geh met ymr ch quest oruulah blomjtoi
5. mission ⇒ ene hesegt dan check-in hiih zuils bh buguud ihevchlen mongoliin aylal juulchlaltai holbootoi gazruud orno. mission ii undsen page dr card baidlaar buh mission uud haragdah buguud card ni zurag title xp zereg ni haragdana. mission detail ruu oronguut tuhain missionii tuuh aylagchdad zoriulsn tip ntr bairlaad mun mission iig acquire hiihed tus bloh uuruur helvel damjin ungurj bui tours uud haragdana.
6. tour ⇒ ene page dr tour company iin uusgesen aylluud card baidlaar haragdah buguud card ni zurag title duration price missionuud ni badge baidlaar haragdana. tour detail ruu orood harval ymr2 mission dr bga gazruudaar reach hiij yvh ve gdg ni haragdana agenda ni hragdana.
7. hereglegch nuuts ug sergeedeg baih.
8. mission ii radius ruu orohod missiontoi holbootoi quest uud haragdah buguud top highlight quest ni notification bolj ochino. bas davhar ta ene mission ii bused orloo gsn notif hamtad ni ochino.
9. dashboard deerhi active journey gsn dr join expedition gsn heseg bh buguud join expedition iin deer ni label bna tend ni tour company aas irsen invite code iig oruulsnaar expeditiond orj bgan 

Admin 

1. hereglegchiin role iig solidog baina.
2. quest nemdeg baina.
3. company uusgedeg baina. tuhain uussen company iig udirdah hun ni moderator roletoi baina. 
4. mission nemdeg baina.

moderator 

1. company ii profile iig udirdana
2. guide nemne(urij oruulna)
3. yrunhii aylaliin medeelliig oruulna.
4. room uusgene. tuhain room ni neg aylald garj bui jijig groupuuded zoriulagdsan zuil buguud aylagchid room ruu moderator iin room tus bur dr uusgej ugsun invite code oruulsnaar room ruugee orno gsn ug. ingesneer guide ni agendag flexible udirdaad yvahad undsen agenda bolon zeregtseed hamt yvj bui groupuuded uurchlult haragdahgui tuhain groupd l uurchlugduj notif ochno gsn ug. 
5. moderator ni yrunhii agenda-g oruulah ch gsn guide uud ni nariin iteniarieryg oruulna. jishee ni moderatoriin oruulsan tours page dr haragdah agenda ni 

- Ride a two humped camel over the dunes
- Visit ancient capital of Mongols
- stay with a nomadic family in their encampment and marvel at the starry sky
- Visit all the must be see locations of Centtral Mongolia
- riding horse in the Khugnu tarna national park

iim bailaa gej bodoy tegvel guide uud ni uuriin room dree yg zogsoh gazar bolgoniig tsagtai ni oruulj ugnu gsn ug. mun mori unah bolon temee geh zereg tip heregtei zuils dr ayulgui ajillagaanii sanamj bolon heregtei tips uudiig guide oruulj ugnu. ter ni hereglegch tald ehleed notif oor orood app dotor bh uyd yg tuhain activity ehlehiin umnu dahin haruulj sanuuldag baina.

1. olon moderator company bh buguud tedgeer company uud zuvhun uursdiin uusgesen tour dree l crud erhtei bna. mun 1 moderator olon companytai bj blku harin neg company olon moderatortou bj bolno

gamification

1. point nemegdehed pointiin zurag maani smooth flip hiigdeh ystoi.
2. xp nemegdehed progress bar smooth duureh ystoi
3. mun quest ni xp uguhgui zuvhn point ugnu. quest iig biyluulmegts animationtoi bh ystoi
4. mission dr xp nemegdene
5. rank ahih uyd shine rankiig mash goy unbox shig vibetai animationtoi bh ystoi 
6. Нарийн Geolocation ажиллуулах нь утасны батарейг маш хурдан бардаг (Жуулчинд батарей маш чухал). Тиймээс **Geofencing API** эсвэл PWA-ийн Background Geolocation ашиглана. Мөн заавал утасны өөрийнх нь системээс **Web Push Notifications** эрхийг анх нэвтрэхэд нь авсан байх шаардлагатай.

guide 

1. agendag udirdah home heseg baina

important notes :

PWA-ийн **Service Workers** болон Supabase-ийн локал кэшийг (эсвэл IndexedDB) ашиглаж, тухайн аялал эхлэхэд бүх Agenda, Tips, Квестүүдийг утсан дээр нь урьдчилаад татаж аваад локал хадгалдаг байх ёстой. Жуулчин офлайн байхдаа Check-in хийж, зураг авч квест биелүүлж болно (локал баазад `is_synced = false` төлөвтэй хадгалагдана). Сүлжээ орж ирэнгүүт цаанаа автомат sync хийгдэж, Supabase руу мэдээллээ шидэж, XP/Point нь бодогдоно.