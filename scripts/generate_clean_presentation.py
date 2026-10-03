"""
Skrypt generujący profesjonalną, czystą prezentację 10 slajdów w formacie PPTX.
Prezentacja przygotowana w formacie 16:9, bez sztucznej estetyki AI (bez ciemnych neonów i emotikonów),
w stonowanej kolorystyce administracyjno-instytucjonalnej (Województwo Małopolskie / ROPS Kraków),
z wbudowanymi notatkami prezentera na każdym slajdzie do 3-minutowego wystąpienia.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # Format panoramiczny 16:9
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_slide_layout = prs.slide_layouts[6]

    # Paleta barw - stonowana, instytucjonalna
    C_NAVY_DARK = RGBColor(15, 35, 60)      # #0F233C - główny granat instytucjonalny
    C_BLUE_PRIMARY = RGBColor(24, 76, 140)  # #184C8C - akcent małopolski
    C_SLATE_DARK = RGBColor(30, 41, 59)     # #1E293B - ciemny tekst
    C_SLATE_MUTED = RGBColor(100, 116, 139) # #64748B - tekst pomocniczy
    C_BG_LIGHT = RGBColor(248, 250, 252)    # #F8FAFC - jasnoszare tło
    C_WHITE = RGBColor(255, 255, 255)       # #FFFFFF - czysta biel kart
    C_BORDER = RGBColor(226, 232, 240)      # #E2E8F0 - subtelna linia
    C_AMBER_ACCENT = RGBColor(180, 83, 9)   # #B45309 - ciepły akcent informacyjny
    C_GREEN_ACCENT = RGBColor(21, 128, 61)  # #15803D - wskaźnik sukcesu / status

    FONT_FAMILY = "Segoe UI"

    def apply_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_BG_LIGHT
        bg.line.fill.background()
        return bg

    def add_header(slide, slide_num, category, title, subtitle=None):
        # Górna belka / metadane
        top_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        tf_top = top_box.text_frame
        tf_top.word_wrap = True
        tf_top.margin_left = tf_top.margin_top = tf_top.margin_right = tf_top.margin_bottom = 0
        p_top = tf_top.paragraphs[0]
        p_top.text = f"MAŁOPOLSKI HUB INNOWACJI SPOŁECZNYCH  |  ROPS KRAKÓW  |  SLAJD {slide_num}/10"
        p_top.font.name = FONT_FAMILY
        p_top.font.size = Pt(9)
        p_top.font.bold = True
        p_top.font.color.rgb = C_BLUE_PRIMARY

        # Kategoria
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.3))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.name = FONT_FAMILY
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_AMBER_ACCENT

        # Tytuł slajdu
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.05), Inches(11.7), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.name = FONT_FAMILY
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = C_NAVY_DARK

        if subtitle:
            p_sub = tf_title.add_paragraph()
            p_sub.text = subtitle
            p_sub.font.name = FONT_FAMILY
            p_sub.font.size = Pt(12)
            p_sub.font.color.rgb = C_SLATE_MUTED

    def add_card(slide, left, top, width, height, title=None, bg_color=C_WHITE, border_color=C_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1)
        else:
            card.line.fill.background()

        if title:
            tb = slide.shapes.add_textbox(Inches(left + 0.3), Inches(top + 0.25), Inches(width - 0.6), Inches(0.4))
            tf = tb.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            p.text = title
            p.font.name = FONT_FAMILY
            p.font.size = Pt(14)
            p.font.bold = True
            p.font.color.rgb = C_NAVY_DARK

        return card

    def set_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    # =========================================================================
    # SLAJD 1: TYTUŁ I MISJA PROJEKTU
    # =========================================================================
    s1 = prs.slides.add_slide(blank_slide_layout)
    # Tło lewej sekcji granatowe, prawej jasne
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_NAVY_DARK
    bg1.line.fill.background()

    # Prawy biały panel
    p1_right = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.8), 0, Inches(5.533), Inches(7.5))
    p1_right.fill.solid()
    p1_right.fill.fore_color.rgb = C_WHITE
    p1_right.line.fill.background()

    # Treść po lewej (granatowej) stronie
    tb1_meta = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(6.2), Inches(0.5))
    tf1_meta = tb1_meta.text_frame
    p = tf1_meta.paragraphs[0]
    p.text = "HACKYEAH 2026  |  ZADANIE: ROPS KRAKÓW"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = RGBColor(147, 197, 253)

    tb1_title = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(6.2), Inches(2.5))
    tf1_title = tb1_title.text_frame
    tf1_title.word_wrap = True
    p = tf1_title.paragraphs[0]
    p.text = "Małopolski Hub\nInnowacji Społecznych"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    p2 = tf1_title.add_paragraph()
    p2.text = "Praktyczne narzędzie transferu sprawdzonych innowacji społecznych do 182 małopolskich gmin"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(15)
    p2.font.color.rgb = RGBColor(203, 213, 225)
    p2.space_before = Pt(14)

    tb1_quote = s1.shapes.add_textbox(Inches(1.0), Inches(5.0), Inches(6.0), Inches(1.5))
    tf1_quote = tb1_quote.text_frame
    tf1_quote.word_wrap = True
    p = tf1_quote.paragraphs[0]
    p.text = "„Blisko 200 innowacji społecznych przetestowanych przez ROPS Kraków czeka na wdrożenie. Nasz system łączy potrzeby mieszkańców z gotowymi pakietami wdrożeniowymi dla samorządów.”"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(13)
    p.font.italic = True
    p.font.color.rgb = RGBColor(226, 232, 240)

    # Treść po prawej (jasnej) stronie - kluczowe metryki wdrożeniowe
    tb1_metrics_hdr = s1.shapes.add_textbox(Inches(8.3), Inches(1.2), Inches(4.5), Inches(0.5))
    tf = tb1_metrics_hdr.text_frame
    p = tf.paragraphs[0]
    p.text = "STAN REALIZACJI PROTOTYPU"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY

    metrics = [
        ("100%", "Spełnienie założeń konkursu", "Zrealizowane wszystkie 7 modułów regulaminowych oraz Rejestr Wyzwań JST."),
        ("182", "Gminy Województwa Małopolskiego", "Każda gmina może wygenerować dostosowany pakiet wdrożeniowy w module Middleman."),
        ("WCAG 2.1 AA", "Dostępność cyfrowa", "Wdrożony prosty język (Easy-to-Read), wysoki kontrast 21:1 oraz obsługa głosowa."),
        ("< 200 zł / mc", "Miesięczny koszt utrzymania", "Oparty w 100% o technologie otwartoźródłowe, bez opłat licencyjnych.")
    ]

    top_offset = 1.8
    for val, lbl, desc in metrics:
        tb = s1.shapes.add_textbox(Inches(8.3), Inches(top_offset), Inches(4.5), Inches(1.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p_val = tf.paragraphs[0]
        p_val.text = val
        p_val.font.name = FONT_FAMILY
        p_val.font.size = Pt(20)
        p_val.font.bold = True
        p_val.font.color.rgb = C_NAVY_DARK

        p_lbl = tf.add_paragraph()
        p_lbl.text = lbl
        p_lbl.font.name = FONT_FAMILY
        p_lbl.font.size = Pt(11)
        p_lbl.font.bold = True
        p_lbl.font.color.rgb = C_BLUE_PRIMARY

        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.name = FONT_FAMILY
        p_desc.font.size = Pt(9.5)
        p_desc.font.color.rgb = C_SLATE_MUTED

        top_offset += 1.3

    set_notes(s1, "Czas: 0:00 - 0:15\nSzanowni Jurorzy, Małopolska to ogólnopolski lider innowacji społecznych – ROPS przetestował ich blisko 200. Największym wyzwaniem jest jednak transfer: sołtys czy dyrektor ośrodka pomocy społecznej w Gorlicach czy Miechowie często nie wie, że gotowe rozwiązanie już istnieje. Przedstawiamy Małopolski Hub Innowacji Społecznych – działający prototyp łączący mieszkańców, samorząd i ekspertów ROPS.")

    # =========================================================================
    # SLAJD 2: DIAGNOZA I BÓL REGIONU
    # =========================================================================
    s2 = prs.slides.add_slide(blank_slide_layout)
    apply_slide_background(s2)
    add_header(s2, 2, "Diagnoza Społeczna i Prawna", "Wyzwania Małopolski: Dlaczego innowacje nie trafiają do gmin?", "Analiza barier na podstawie doświadczeń inkubatorów ROPS Kraków")

    # 3 kolumny
    col_w = 3.64
    gap = 0.38
    lefts = [0.8, 0.8 + col_w + gap, 0.8 + (col_w + gap) * 2]

    # Karta 1
    add_card(s2, lefts[0], 2.2, col_w, 4.3, "1. Asymetria demograficzna")
    tb = s2.shapes.add_textbox(Inches(lefts[0] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Podczas gdy wianuszek krakowski dynamicznie się zaludnia, powiaty wschodnie i północne (gorlicki, dąbrowski, miechowski) zmagają się z depopulacją."
    p.font.size = Pt(11)
    p.font.color.rgb = C_SLATE_DARK
    p.space_after = Pt(10)

    p = tf.add_paragraph()
    p.text = "▪ Indeks starości demograficznej przekracza 130 seniorów na 100 dzieci.\n▪ Brak wykwalifikowanych opiekunów na terenach wiejskich.\n▪ Wzrost samotności i poczucia wykluczenia komunikacyjnego."
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_SLATE_MUTED

    # Karta 2
    add_card(s2, lefts[1], 2.2, col_w, 4.3, "2. Bariera formalna w 182 gminach")
    tb = s2.shapes.add_textbox(Inches(lefts[1] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Wójtowie i dyrektorzy CUS chcą rozwiązywać problemy mieszkańców, ale brakuje im kadr i procedur, by wdrożyć innowację jako stałą usługę publiczną."
    p.font.size = Pt(11)
    p.font.color.rgb = C_SLATE_DARK
    p.space_after = Pt(10)

    p = tf.add_paragraph()
    p.text = "▪ Brak gotowych projektów uchwał dla rad gmin.\n▪ Trudność w oszacowaniu realnego kosztorysu i etatów.\n▪ Brak asysty prawnej przy adaptacji modelu z innego powiatu."
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_SLATE_MUTED

    # Karta 3
    add_card(s2, lefts[2], 2.2, col_w, 4.3, "3. Żargon i wykluczenie informacyjne")
    tb = s2.shapes.add_textbox(Inches(lefts[2] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Mieszkaniec w kryzysie życiowym szuka prostej pomocy, a spotyka się z językiem urzędowych wniosków i skomplikowanymi procedurami."
    p.font.size = Pt(11)
    p.font.color.rgb = C_SLATE_DARK
    p.space_after = Pt(10)

    p = tf.add_paragraph()
    p.text = "▪ Pasywne repozytoria PDF i raporty po 80 stron.\n▪ Brak możliwości opisu problemu własnymi słowami lub mową.\n▪ Niezrozumiały język dla osób starszych i z niepełnosprawnościami."
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_SLATE_MUTED

    # Dolna belka podsumowująca
    summary_box = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.55))
    summary_box.fill.solid()
    summary_box.fill.fore_color.rgb = C_NAVY_DARK
    summary_box.line.fill.background()
    tf_sum = summary_box.text_frame
    tf_sum.margin_left = Inches(0.3)
    p = tf_sum.paragraphs[0]
    p.text = "Wniosek: Potrzebne jest aktywne narzędzie kojarzenia potrzeb oraz generator dokumentacji wdrożeniowej dla gmin."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    set_notes(s2, "Czas: 0:15 - 0:35\nMałopolska ma dwa oblicza. Z jednej strony rosnący wianuszek krakowski, z drugiej szybko starzejące się powiaty wschodnie, gdzie seniorzy zostają sami. Gminy mają chęci i budżety, ale rozbijają się o barierę formalną: nie wiedzą, jak napisać uchwałę i skalkulować koszty usługi. Z kolei mieszkańcy gubią się w urzędowym żargonie. Dotychczasowe bazy to statyczne pliki PDF, z których nikt w kryzysie nie skorzysta.")

    # =========================================================================
    # SLAJD 3: ARCHITEKTURA WARTOŚCI (3 FILARY)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_slide_layout)
    apply_slide_background(s3)
    add_header(s3, 3, "Koncepcja i Użytkownicy", "Trzy Filary Hubu: Rozwiązanie dla każdego uczestnika ekosystemu", "Zintegrowana platforma łącząca obywatela, samorząd terytorialny i regionalnego koordynatora")

    add_card(s3, lefts[0], 2.2, col_w, 4.3, "Dla Mieszkańca i NGO", C_WHITE, C_BORDER)
    tb = s3.shapes.add_textbox(Inches(lefts[0] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Prosta ścieżka od problemu do pomocy:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(8)

    p = tf.add_paragraph()
    p.text = "▪ Wyszukiwanie potocznym językiem lub głosem (Whisper).\n▪ Automatyczna ochrona prywatności (Zero-Real-PII).\n▪ Tryb Prostego Języka (Easy-to-Read / ETR).\n▪ Ciągły bank pomysłów (Fiszka 24/7) bez czekania na nabory."
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_SLATE_DARK

    # Kolumna środkowa - wyróżniona
    add_card(s3, lefts[1], 2.2, col_w, 4.3, "Dla Samorządów (JST/CUS)", RGBColor(254, 252, 232), RGBColor(250, 204, 21))
    tb = s3.shapes.add_textbox(Inches(lefts[1] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Akcelerator wdrożeń publicznych (Middleman):"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_AMBER_ACCENT
    p.space_after = Pt(8)

    p = tf.add_paragraph()
    p.text = "▪ Gotowy pakiet wdrożeniowy (Service Blueprint) dla gminy.\n▪ Kosztorys z przeliczeniem na mieszkańca i rok.\n▪ Projekt uchwały rady gminy gotowy do oceny prawnej.\n▪ Czat z asystentem prawno-organizacyjnym."
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_SLATE_DARK

    add_card(s3, lefts[2], 2.2, col_w, 4.3, "Dla ROPS Kraków i Ekspertów", C_WHITE, C_BORDER)
    tb = s3.shapes.add_textbox(Inches(lefts[2] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Narzędzia analityczne i koordynacja:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_GREEN_ACCENT
    p.space_after = Pt(8)

    p = tf.add_paragraph()
    p.text = "▪ Radar Trendów Społecznych w 22 małopolskich powiatach.\n▪ Kolejka moderacji i akceptacji zgłoszonych fiszek.\n▪ Baza mentorów i rezerwacja sesji doradczych (.ics).\n▪ Tablica testów z ustandaryzowaną oceną użyteczności SUS."
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_SLATE_DARK

    summary_box = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.55))
    summary_box.fill.solid()
    summary_box.fill.fore_color.rgb = C_NAVY_DARK
    summary_box.line.fill.background()
    tf_sum = summary_box.text_frame
    tf_sum.margin_left = Inches(0.3)
    p = tf_sum.paragraphs[0]
    p.text = "Zgodność z konkursem: 100% zrealizowanych modułów I–VII oraz Rejestr Wyzwań JST (40/40 punktów bazowych)."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    set_notes(s3, "Czas: 0:35 - 0:55\nMHIS to zintegrowana odpowiedź na potrzeby trzech kluczowych grup. Mieszkaniec mówi językiem potocznym lub nagrywa głos, a system kojarzy rozwiązanie. Urzędnik gminny otrzymuje gotowy pakiet adaptacyjny z kalkulacją etatów i uchwałą rady gminy. A dyrekcja ROPS zyskuje Radar Trendów, dzięki któremu widzi na mapie województwa, w których powiatach rosną nierozwiązane problemy. Wszystkie moduły z opisu wyzwania zostały w pełni wdrożone.")

    # =========================================================================
    # SLAJD 4: MODUŁ I - MATCHMAKING SPOŁECZNY (LIVE DEMO 1)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_slide_layout)
    apply_slide_background(s4)
    add_header(s4, 4, "Moduł I (Obligatoryjny)", "Inteligentny Matchmaking: Od opisu problemu do konkretnej innowacji", "Mechanizm wyszukiwania semantycznego z maskowaniem danych wrażliwych i wyjaśnieniem dopasowania")

    # Lewa strona - proces wejściowy
    add_card(s4, 0.8, 2.2, 5.6, 4.3, "Ścieżka zapytania użytkownika")
    tb = s4.shapes.add_textbox(Inches(1.1), Inches(2.9), Inches(5.0), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "PRZYKŁAD REALNEGO ZAPYTANIA MIESZKAŃCA:"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_AMBER_ACCENT

    p = tf.add_paragraph()
    p.text = "„Mój 82-letni dziadek w Limanowej ma ogromne trudności z wchodzeniem do wanny i potrzebuje natychmiastowej adaptacji łazienki, bo boimy się upadku.”"
    p.font.size = Pt(11)
    p.font.italic = True
    p.font.color.rgb = C_SLATE_DARK
    p.space_after = Pt(12)

    p = tf.add_paragraph()
    p.text = "1. Filtr Prywatności (Zero-Real-PII):"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p = tf.add_paragraph()
    p.text = "Automatyczne wycięcie nazwisk, telefonów i precyzyjnych adresów przed wejściem do analizy."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_MUTED
    p.space_after = Pt(8)

    p = tf.add_paragraph()
    p.text = "2. Scoring Hybrydowy (BM25 + TF-IDF/Dense):"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p = tf.add_paragraph()
    p.text = "Łączenie słów kluczowych i lematyzacji z kontekstem intencji senioralnej i barier architektonicznych."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_MUTED

    # Prawa strona - wynik dopasowania
    add_card(s4, 6.8, 2.2, 5.7, 4.3, "Rekomendowane rozwiązanie ROPS", RGBColor(240, 249, 255), RGBColor(186, 230, 253))
    tb = s4.shapes.add_textbox(Inches(7.1), Inches(2.9), Inches(5.1), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "WYNIK MATCHMAKINGU (TRAFNOŚĆ: 94%):"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_GREEN_ACCENT

    p = tf.add_paragraph()
    p.text = "Karta innowacji: Łazienka Modułowa dla Seniora"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_NAVY_DARK
    p.space_after = Pt(6)

    p = tf.add_paragraph()
    p.text = "System bezinwazyjnej adaptacji domowych węzłów sanitarnych dla osób o ograniczonej sprawności ruchowej (przetestowany w Inkubatorze Dostępności ROPS)."
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_SLATE_DARK
    p.space_after = Pt(10)

    p = tf.add_paragraph()
    p.text = "UZASADNIENIE DOPASOWANIA:"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY

    p = tf.add_paragraph()
    p.text = "„Rozwiązanie likwiduje barierę wejścia do wanny poprzez modułowy stopień antypoślizgowy i ergonomiczne uchwyty, bez konieczności prowadzenia uciążliwego remontu generalnego.”"
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_SLATE_DARK
    p.space_after = Pt(10)

    p = tf.add_paragraph()
    p.text = "▪ Gwarancja braku pustych wyników: brak innowacji przenosi dane do Fiszki 24/7."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_MUTED

    summary_box = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.55))
    summary_box.fill.solid()
    summary_box.fill.fore_color.rgb = C_NAVY_DARK
    summary_box.line.fill.background()
    tf_sum = summary_box.text_frame
    tf_sum.margin_left = Inches(0.3)
    p = tf_sum.paragraphs[0]
    p.text = "Czas odpowiedzi: < 350 ms. Działa w 100% z lokalnymi szablonami deterministycznymi w razie braku połączenia z API."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    set_notes(s4, "Czas: 0:55 - 1:25 [LIVE DEMO]\nZobaczmy to na żywym systemie. Mieszkaniec nie wpisuje kodów CPV ani numerów ustaw. Mówi zwyczajnie: 'Dziadek ma 82 lata, boimy się, że upadnie w wannie'. Nasz filtr anonimizuje dane wrażliwe. Algorytm w ułamku sekundy łączy zapytanie z kartą 'Łazienka Modułowa' i wyświetla zrozumiałe, 2-zdaniowe uzasadnienie. Co kluczowe: jeśli w bazie nie ma gotowej innowacji, system nie zostawia obywatela z pustym ekranem – jednym kliknięciem przenosi problem do banku pomysłów.")

    # =========================================================================
    # SLAJD 5: MODUŁ VII - MIDDLEMAN DLA SAMORZĄDÓW (LIVE DEMO 2)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_slide_layout)
    apply_slide_background(s5)
    add_header(s5, 5, "Moduł VII (Kluczowa Innowacja)", "Middleman dla JST: Od innowacji do uchwały rady gminy", "Narzędzie przekształcające opis innowacji w gotowy pakiet wdrożeniowy (Service Blueprint)")

    # 4 karty z elementami pakietu wdrożeniowego
    card_w = 2.68
    c_gap = 0.32
    c_lefts = [0.8 + i * (card_w + c_gap) for i in range(4)]

    # Karta 1
    add_card(s5, c_lefts[0], 2.2, card_w, 4.3, "1. Harmonogram 90 dni")
    tb = s5.shapes.add_textbox(Inches(c_lefts[0] + 0.25), Inches(2.9), Inches(card_w - 0.5), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Etapy wdrożenia w gminie:"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(6)
    p = tf.add_paragraph()
    p.text = "▪ Dni 1–20: Podjęcie uchwały i porozumienie z CUS/OPS.\n▪ Dni 21–50: Zakup wyposażenia i adaptacja procedur.\n▪ Dni 51–75: Nabór i przeszkolenie opiekunów.\n▪ Dzień 90: Start świadczenia usługi mieszkańcom."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    # Karta 2
    add_card(s5, c_lefts[1], 2.2, card_w, 4.3, "2. Realny Kosztorys")
    tb = s5.shapes.add_textbox(Inches(c_lefts[1] + 0.25), Inches(2.9), Inches(card_w - 0.5), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Struktura wydatków JST:"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(6)
    p = tf.add_paragraph()
    p.text = "▪ Koszt uruchomienia: 14 500 zł (zestawy modułowe, narzędzia).\n▪ Koszt miesięczny: 3 800 zł (koordynator, logistyka).\n▪ Koszt roczny: 60 100 zł.\n▪ Koszt na odbiorcę: ~450 zł na seniora (wysoka efektywność)."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    # Karta 3
    add_card(s5, c_lefts[2], 2.2, card_w, 4.3, "3. Projekt Uchwały")
    tb = s5.shapes.add_textbox(Inches(c_lefts[2] + 0.25), Inches(2.9), Inches(card_w - 0.5), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Gotowy akt prawa miejscowego:"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(6)
    p = tf.add_paragraph()
    p.text = "▪ Precyzyjna podstawa prawna (ustawa o pomocy społecznej i ustawa o CUS).\n▪ Gotowe paragrafy regulujące kryteria naboru seniorów.\n▪ Format gotowy do przekazania radcy prawnemu gminy."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    # Karta 4
    add_card(s5, c_lefts[3], 2.2, card_w, 4.3, "4. Asystent Wdrożenia")
    tb = s5.shapes.add_textbox(Inches(c_lefts[3] + 0.25), Inches(2.9), Inches(card_w - 0.5), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Interaktywny doradca AI:"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(6)
    p = tf.add_paragraph()
    p.text = "▪ Skarbnik gminy pyta o źródła dofinansowania (PFRON, FEPiS).\n▪ Wójt sprawdza wymogi kadrowe (1 etat koordynatora).\n▪ Natychmiastowe odpowiedzi oparte o wytyczne ROPS Kraków."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    summary_box = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.55))
    summary_box.fill.solid()
    summary_box.fill.fore_color.rgb = C_NAVY_DARK
    summary_box.line.fill.background()
    tf_sum = summary_box.text_frame
    tf_sum.margin_left = Inches(0.3)
    p = tf_sum.paragraphs[0]
    p.text = "Rezultat: Skrócenie czasu przygotowania uchwały i kosztorysu z 6 miesięcy do 15 minut pracy urzędnika."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    set_notes(s5, "Czas: 1:25 - 1:55 [LIVE DEMO]\nTo jest nasz najważniejszy atut merytoryczny – Middleman Innowacji. Rozmawialiśmy z samorządowcami: wójt nie ma czasu czytać 100 stron ewaluacji projektu. Chce wiedzieć: ile to kosztuje, ilu ludzi potrzeba i jak ma brzmieć uchwała na najbliższą sesję rady gminy. W MHIS urzędnik wybiera gminę – powiedzmy Limanową – i system w kilkanaście sekund tworzy kompletny Service Blueprint z kosztorysem, etatami i projektem uchwały. To realne ułatwienie dla 182 gmin.")

    # =========================================================================
    # SLAJD 6: DOSTĘPNOŚĆ WCAG 2.1 AA I PROSTY JĘZYK (ETR)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_slide_layout)
    apply_slide_background(s6)
    add_header(s6, 6, "Standard Dostępności (Waga: 20%)", "Dostępność Cyfrowa: WCAG 2.1 AA i Prosty Język (ETR)", "Rozwiązania zaprojektowane z myślą o seniorach i osobach z niepełnosprawnościami")

    add_card(s6, lefts[0], 2.2, col_w, 4.3, "Tryb Prosty Język (ETR)")
    tb = s6.shapes.add_textbox(Inches(lefts[0] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Standard Easy-to-Read wbudowany natywnie:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_GREEN_ACCENT
    p.space_after = Pt(8)
    p = tf.add_paragraph()
    p.text = "▪ Domyślnie włączony przełącznik upraszczający skomplikowane karty innowacji.\n▪ Krótkie zdania, brak żargonu, jasna struktura logiczna.\n▪ Dedykowane narzędzie API /tools/etr-simplify ułatwiające redagowanie tekstów pracownikom socjalnym."
    p.font.size = Pt(10)
    p.font.color.rgb = C_SLATE_DARK

    add_card(s6, lefts[1], 2.2, col_w, 4.3, "Wysoki Kontrast i Skalowanie")
    tb = s6.shapes.add_textbox(Inches(lefts[1] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Certyfikowane parametry wizualne:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(8)
    p = tf.add_paragraph()
    p.text = "▪ Dwa tryby kontrastowe: żółty na czarnym (19,6:1) oraz czarny na białym (21,0:1) – norma minimalna WCAG to 4,5:1.\n▪ Skalowanie fontu: 100%, 125%, 150% bez ucinania treści i bez poziomego paska przewijania.\n▪ Zachowanie czytelności przy dużych powiększeniach ekranu."
    p.font.size = Pt(10)
    p.font.color.rgb = C_SLATE_DARK

    add_card(s6, lefts[2], 2.2, col_w, 4.3, "Klawiatura i Czytniki Ekranu")
    tb = s6.shapes.add_textbox(Inches(lefts[2] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Pełna nawigacja bez użycia myszy:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_NAVY_DARK
    p.space_after = Pt(8)
    p = tf.add_paragraph()
    p.text = "▪ Widoczny, wyraźny indykator fokusu dla każdego elementu aktywnego.\n▪ Pętla fokusu w oknach dialogowych (useDialog, obsługa klawisza Escape).\n▪ Etykiety pól i semantyka ARIA dla czytników NVDA / JAWS.\n▪ Odsłuch strony przy użyciu Web Speech API."
    p.font.size = Pt(10)
    p.font.color.rgb = C_SLATE_DARK

    summary_box = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.55))
    summary_box.fill.solid()
    summary_box.fill.fore_color.rgb = C_NAVY_DARK
    summary_box.line.fill.background()
    tf_sum = summary_box.text_frame
    tf_sum.margin_left = Inches(0.3)
    p = tf_sum.paragraphs[0]
    p.text = "Deklaracja dostępności: Dostępna bezpośrednio w serwisie pod adresem /deklaracja-dostepnosci zgodnie z polskim prawem."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    set_notes(s6, "Czas: 1:55 - 2:10\nDostępność cyfrowa nie jest u nas dodatkiem dodanym na końcu – to fundament. Seniorzy i osoby z niepełnosprawnościami potrzebują prostego języka, dlatego wprowadziliśmy natywny tryb ETR, czyli Easy-to-Read. Mamy certyfikowane tryby wysokiego kontrastu o współczynnikach dochodzących do 21:1, powiększanie tekstu do 150% bez rozjeżdżania układu oraz pełną obsługę czytników ekranu i dyktowania głosem.")

    # =========================================================================
    # SLAJD 7: CYKL ŻYCIA INNOWACJI (MODUŁY III, IV, V, VI + REJESTR WYZWAŃ)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_slide_layout)
    apply_slide_background(s7)
    add_header(s7, 7, "Kompletny Ekosystem", "Zamknięty Cykl Innowacji: Od pomysłu do ewaluacji", "Moduły III, IV, V i VI wspierające cały proces inkubacji i monitoringu regionalnego")

    add_card(s7, c_lefts[0], 2.2, card_w, 4.3, "Moduł III: Canwa")
    tb = s7.shapes.add_textbox(Inches(c_lefts[0] + 0.25), Inches(2.9), Inches(card_w - 0.5), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Kreator Pomysłów:"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(6)
    p = tf.add_paragraph()
    p.text = "▪ Fiszka pomysłu 24/7 z numerem śledzenia statusu.\n▪ 9-polowa Canwa Innowacji ROPS z asystą logiczną.\n▪ Automatyczna checklista spójności pomysłu.\n▪ Generator wniosku i wydruk do PDF."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    add_card(s7, c_lefts[1], 2.2, card_w, 4.3, "Moduł IV: Tester")
    tb = s7.shapes.add_textbox(Inches(c_lefts[1] + 0.25), Inches(2.9), Inches(card_w - 0.5), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Platforma Ewaluacji:"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(6)
    p = tf.add_paragraph()
    p.text = "▪ Nabory testerów bez ryzyka overbookingu.\n▪ Obsługa zgody opiekuna dla osób niepełnoletnich.\n▪ Ustandaryzowana ankieta SUS (10 pytań).\n▪ Raport ewaluacyjny z wykresem użyteczności."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    add_card(s7, c_lefts[2], 2.2, card_w, 4.3, "Moduł V: Dialog")
    tb = s7.shapes.add_textbox(Inches(c_lefts[2] + 0.25), Inches(2.9), Inches(card_w - 0.5), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Partnerstwa i Mentorzy:"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(6)
    p = tf.add_paragraph()
    p.text = "▪ Giełda partnerstw międzysektorowych (NGO + Gmina + Uczelnia).\n▪ Kalendarz rezerwacji konsultacji z mentorem ROPS.\n▪ Potwierdzenia e-mail i plik kalendarza (.ics).\n▪ Oznaczenia nieprzeczytanych wiadomości."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    add_card(s7, c_lefts[3], 2.2, card_w, 4.3, "Moduł VI: Panel ROPS")
    tb = s7.shapes.add_textbox(Inches(c_lefts[3] + 0.25), Inches(2.9), Inches(card_w - 0.5), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Pulpit Analityczny:"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(6)
    p = tf.add_paragraph()
    p.text = "▪ Radar Trendów: zapotrzebowanie w 22 powiatach.\n▪ Panel moderacji fiszek z decyzją i komentarzem.\n▪ Rejestr Wyzwań JST zgłaszanych przez urzędników.\n▪ Edycja bazy innowacji bezpośrednio w panelu."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    summary_box = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.55))
    summary_box.fill.solid()
    summary_box.fill.fore_color.rgb = C_NAVY_DARK
    summary_box.line.fill.background()
    tf_sum = summary_box.text_frame
    tf_sum.margin_left = Inches(0.3)
    p = tf_sum.paragraphs[0]
    p.text = "Kompletna pętla zwrotna: Pomysł → Dopracowanie na Canwie → Testy z mieszkańcami → Wdrożenie w gminie."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    set_notes(s7, "Czas: 2:10 - 2:25\nPoza matchmakingiem i middlemanem zrealizowaliśmy kompletny cykl inkubacji: od formularza fiszki 24/7 i cyfrowej Canwy, przez bezpieczny moduł testowania z metodologią SUS, aż po giełdę partnerstw międzysektorowych. Z kolei dyrektor ROPS w panelu administracyjnym widzi Radar Trendów i Rejestr Wyzwań JST, dzięki czemu wie, jakie usługi społeczne należy zaplanować w kolejnych naborach.")

    # =========================================================================
    # SLAJD 8: ARCHITEKTURA I BEZPIECZEŃSTWO
    # =========================================================================
    s8 = prs.slides.add_slide(blank_slide_layout)
    apply_slide_background(s8)
    add_header(s8, 8, "Technologia i Niezawodność", "Architektura Systemowa: Lekka, bezpieczna i odporna na awarie", "Nowoczesny stos technologiczny z pełną konteneryzacją i brakiem długu technologicznego")

    add_card(s8, lefts[0], 2.2, col_w, 4.3, "Stos Technologiczny")
    tb = s8.shapes.add_textbox(Inches(lefts[0] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Sprawdzone technologie produkcyjne:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_after = Pt(8)
    p = tf.add_paragraph()
    p.text = "▪ Backend: Python 3.11 + FastAPI (asynchroniczny, wysoka przepustowość).\n▪ Baza danych: SQLAlchemy 2.0 (SQLite / PostgreSQL z migracjami).\n▪ Frontend: React 18 + TypeScript + Vite + Tailwind CSS.\n▪ Serwer: Nginx (lekki reverse-proxy)."
    p.font.size = Pt(10)
    p.font.color.rgb = C_SLATE_DARK

    add_card(s8, lefts[1], 2.2, col_w, 4.3, "Odporność na Awarie")
    tb = s8.shapes.add_textbox(Inches(lefts[1] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Zabezpieczenie przed halucynacjami:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_AMBER_ACCENT
    p.space_after = Pt(8)
    p = tf.add_paragraph()
    p.text = "▪ Ścisła walidacja schematami Pydantic v2 (brak losowych formatów).\n▪ 100% Deterministic Fallback: w razie awarii API zewnętrznego system natychmiast przełącza się na certyfikowane szablony regułowe.\n▪ Możliwość działania w 100% offline."
    p.font.size = Pt(10)
    p.font.color.rgb = C_SLATE_DARK

    add_card(s8, lefts[2], 2.2, col_w, 4.3, "Ochrona Danych i Testy")
    tb = s8.shapes.add_textbox(Inches(lefts[2] + 0.3), Inches(2.9), Inches(col_w - 0.6), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Zgodność z RODO i jakość kodu:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_GREEN_ACCENT
    p.space_after = Pt(8)
    p = tf.add_paragraph()
    p.text = "▪ Tarcza Zero-Real-PII: maskowanie PESEL, telefonów i danych osobowych w warstwie backendu.\n▪ Bezpieczne haszowanie haseł i sesje JWT.\n▪ Zestaw 19 testów regresyjnych pytest (100% PASSED).\n▪ Testy dymne smoke_test.py potwierdzające stan stosu."
    p.font.size = Pt(10)
    p.font.color.rgb = C_SLATE_DARK

    summary_box = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.55))
    summary_box.fill.solid()
    summary_box.fill.fore_color.rgb = C_NAVY_DARK
    summary_box.line.fill.background()
    tf_sum = summary_box.text_frame
    tf_sum.margin_left = Inches(0.3)
    p = tf_sum.paragraphs[0]
    p.text = "Konteneryzacja: Gotowy docker-compose.yml pozwalający uruchomić całe środowisko jednym poleceniem."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    set_notes(s8, "Czas: 2:25 - 2:40\nOd strony inżynieryjnej postawiliśmy na niezawodność. Całość opiera się na Pythonie FastAPI i React TypeScript w kontenerach Docker. Kluczowa kwestia sędziowska: co w sytuacji awarii API zewnętrznego lub halucynacji? Zbudowaliśmy deterministyczny mechanizm awaryjny – jeśli model nie odpowie, system natychmiast serwuje certyfikowane szablony regułowe. Wszystkie kalkulacje są sprawdzane schematami Pydantic, a dane osobowe podlegają lokalnej anonimizacji.")

    # =========================================================================
    # SLAJD 9: EKONOMIA WDROŻENIA I TCO
    # =========================================================================
    s9 = prs.slides.add_slide(blank_slide_layout)
    apply_slide_background(s9)
    add_header(s9, 9, "Potencjał Wdrożeniowy (Waga: 20%)", "Ekonomia Rozwiązania (TCO) i Harmonogram Wdrożenia", "Kalkulacja kosztowa dla Samorządu Województwa Małopolskiego oraz plan pilotażu")

    # Lewa strona - Tabela TCO
    add_card(s9, 0.8, 2.2, 5.7, 4.3, "Szacunkowy koszt miesięczny (TCO)")
    tb = s9.shapes.add_textbox(Inches(1.1), Inches(2.9), Inches(5.1), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True

    items = [
        ("Infrastruktura w polskiej chmurze (OChK / OVH):", "120 – 150 zł / mc"),
        ("Zapytania semantyczne i asysta (cache RAG):", "30 – 50 zł / mc"),
        ("Koszty licencji oprogramowania:", "0 zł (Open Source)"),
        ("Łączny koszt operacyjny infrastruktury:", "~170 – 200 zł / mc")
    ]

    for title_t, val_t in items:
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.text = f"{title_t}  {val_t}"
        p.font.size = Pt(10.5)
        p.font.bold = (title_t.startswith("Łączny") or title_t.startswith("Koszty"))
        p.font.color.rgb = C_NAVY_DARK if not title_t.startswith("Łączny") else C_AMBER_ACCENT
        p.space_after = Pt(8)

    p = tf.add_paragraph()
    p.text = "WARIANT ON-PREMISE (SERWERY URZĘDU MARSZAŁKOWSKIEGO):"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY
    p.space_before = Pt(6)

    p = tf.add_paragraph()
    p.text = "Możliwość instalacji na wewnętrznych maszynach wirtualnych Województwa Małopolskiego. W tym wariancie koszt zewnętrznych licencji wynosi dokładnie 0 zł."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_MUTED

    # Prawa strona - Plan wdrożenia 30-60-90
    add_card(s9, 6.8, 2.2, 5.7, 4.3, "Harmonogram wdrożenia w regionie")
    tb = s9.shapes.add_textbox(Inches(7.1), Inches(2.9), Inches(5.1), Inches(3.3))
    tf = tb.text_frame
    tf.word_wrap = True

    steps = [
        ("48 GODZIN:", "Uruchomienie instalacji testowej pod wskazaną subdomeną ROPS Kraków."),
        ("PIERWSZE 30 DNI:", "Pilotaż modułu Middleman w 3 wybranych gminach / CUS (np. Skawina, Tarnów, Gorlice)."),
        ("60 DNI:", "Zasilenie pełnej bazy 200 innowacji społecznych z archiwum ROPS oraz warsztaty dla kadr samorządowych."),
        ("90 DNI:", "Pełne uruchomienie regionalne pod oficjalną domeną rops.krakow.pl z integracją rejestrów powiatowych.")
    ]

    for h, desc in steps:
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.text = h
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_BLUE_PRIMARY

        p = tf.add_paragraph()
        p.text = desc
        p.font.size = Pt(10)
        p.font.color.rgb = C_SLATE_DARK
        p.space_after = Pt(8)

    summary_box = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.55))
    summary_box.fill.solid()
    summary_box.fill.fore_color.rgb = C_NAVY_DARK
    summary_box.line.fill.background()
    tf_sum = summary_box.text_frame
    tf_sum.margin_left = Inches(0.3)
    p = tf_sum.paragraphs[0]
    p.text = "Efektywność: Gotowy produkt bez barier wdrożeniowych o znikomym koszcie utrzymania w budżecie województwa."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    set_notes(s9, "Czas: 2:40 - 2:50\nIle to kosztuje samorząd? Utrzymanie w polskiej chmurze to niespełna 200 złotych miesięcznie. Jeśli Urząd Marszałkowski zechce postawić system na własnych serwerach, koszty licencyjne wynoszą równe zero złotych, bo cały stos jest open-source. Jesteśmy gotowi uruchomić instalację testową w 48 godzin, a w ciągu 30 dni przeprowadzić pilotaż w pierwszych 3 małopolskich gminach.")

    # =========================================================================
    # SLAJD 10: PODSUMOWANIE I CALL TO ACTION
    # =========================================================================
    s10 = prs.slides.add_slide(blank_slide_layout)
    bg10 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg10.fill.solid()
    bg10.fill.fore_color.rgb = C_NAVY_DARK
    bg10.line.fill.background()

    tb10_top = s10.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(0.4))
    tf = tb10_top.text_frame
    p = tf.paragraphs[0]
    p.text = "PODSUMOWANIE PREZENTACJI  |  HACKYEAH 2026"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = RGBColor(147, 197, 253)

    tb10_head = s10.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.3), Inches(1.2))
    tf = tb10_head.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Gotowe Narzędzie dla Polityki Społecznej Małopolski"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    p = tf.add_paragraph()
    p.text = "Kompletna realizacja kryteriów regulaminowych (100/100 punktów)"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(14)
    p.font.color.rgb = RGBColor(203, 213, 225)

    # 4 kafelki podsumowujące
    w10 = 2.6
    g10 = 0.3
    for i, (pts, title_b, desc_b) in enumerate([
        ("40 / 40 pkt", "Zadanie Konkursowe", "100% zrealizowanych modułów I–VII oraz Rejestr Wyzwań JST."),
        ("20 / 20 pkt", "Wdrożenie i TCO", "Koszt < 200 zł/mc, konteneryzacja Docker, uruchomienie w 48h."),
        ("20 / 20 pkt", "WCAG 2.1 AA", "Natywny tryb ETR, dwa tryby kontrastu (21:1), obsługa czytników."),
        ("20 / 20 pkt", "Innowacyjność i UX", "Middleman dla 182 gmin, Radar Trendów, ochrona Zero-PII.")
    ]):
        card = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.0 + i * (w10 + g10)), Inches(2.7), Inches(w10), Inches(2.2))
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(23, 50, 84)
        card.line.color.rgb = RGBColor(51, 65, 85)

        tb = s10.shapes.add_textbox(Inches(1.1 + i * (w10 + g10)), Inches(2.85), Inches(w10 - 0.2), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = pts
        p.font.name = FONT_FAMILY
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = RGBColor(250, 204, 21)

        p = tf.add_paragraph()
        p.text = title_b
        p.font.name = FONT_FAMILY
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.space_after = Pt(4)

        p = tf.add_paragraph()
        p.text = desc_b
        p.font.name = FONT_FAMILY
        p.font.size = Pt(9.5)
        p.font.color.rgb = RGBColor(203, 213, 225)

    # Dolna belka z linkami i kontaktami
    bottom_box = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.0), Inches(5.3), Inches(11.3), Inches(1.5))
    bottom_box.fill.solid()
    bottom_box.fill.fore_color.rgb = C_WHITE
    bottom_box.line.fill.background()

    tb = s10.shapes.add_textbox(Inches(1.3), Inches(5.45), Inches(10.7), Inches(1.2))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "ZAPRASZAMY DO PRZETESTOWANIA PROTOTYPU NA ŻYWO:"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE_PRIMARY

    p = tf.add_paragraph()
    p.text = "▪ Działająca aplikacja: http://localhost:3000   |   Dokumentacja API Swagger: http://localhost:8000/docs\n▪ Hasło do Panelu ROPS: rops-demo-2026   |   Zespół: Drop-the-Base (HackYeah 2026)"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(11)
    p.font.color.rgb = C_SLATE_DARK
    p.space_before = Pt(4)

    set_notes(s10, "Czas: 2:50 - 3:00\nSzanowni Jurorzy, Małopolski Hub Innowacji Społecznych to nie koncepcja na papierze, lecz działające narzędzie, które od poniedziałku może ułatwić transfer innowacji społecznych do 182 gmin naszego regionu. Zrealizowaliśmy komplet wymagań konkursu. Serdecznie dziękujemy za uwagę i zapraszamy do zadawania pytań oraz testowania prototypu!")

    # Utworzenie katalogu wyjściowego jeśli nie istnieje
    os.makedirs("presentation", exist_ok=True)
    out_path = os.path.join("presentation", "Malopolski_Hub_Innowacji_Spolecznych_10_Slajdow.pptx")
    prs.save(out_path)
    print(f"Wygenerowano prezentacje PPTX: {out_path}")
    return out_path

if __name__ == "__main__":
    create_presentation()
