// ==============================================================================
//   PARAMETRIC KEYCHAIN CUSTOMIZER – LUCIANO
//   Desenvolvido por: Luciano
//   Modelo Base 3D Original por: Vanessa Matos (Customizable Name Keychains)
//   URL Original: https://makerworld.com/pt/models/2679660-customizable-name-keychains
// ==============================================================================

// USER PARAMETERS
Base_Color      = "Black";
Text_Color      = "#ADD8E6";
Render_Part     = "all"; // ["all", "base", "text"]

Line1_Text      = "Good";
Line2_Text      = "";
Line3_Text      = "";

// FONT SETTINGS (AGORA COM JANELA COMPLETA POR LINHA)
Font_L1 = "Bagel Fat One";   //font
Font_L2 = "Bagel Fat One";   //font
Font_L3 = "Bagel Fat One";   //font

// FONT SIZE POR LINHA (NOVO)
Font_Size_L1 = 20;
Font_Size_L2 = 20;
Font_Size_L3 = 20;

// Slider inteiro (MakerWorld) → converte para decimal
Font_Weight_Steps = 0;   // [-10:1:20]
Font_Weight = Font_Weight_Steps / 10;

// MODEL SETTINGS
Text_Height     = 2;
Plate_Height    = 3;
Border_Size     = 3;

// HOLE OPTIONS
Hole_Position       = "right"; // ["right", "left", "top", "bottom", "none"]
Hole_Radius         = 3;
Ring_Offset         = 0;
Hole_Height_Offset  = 0;

// LINE SPACING
Spacing_L2          = 1.1;   // [0.5:0.1:2]
Spacing_L3          = 1.1;   // [0.5:0.1:2]

// HORIZONTAL OFFSETS
Offset_L1           = 0;     // [-40:1:40]
Offset_L2           = 0;     // [-40:1:40]
Offset_L3           = 0;     // [-40:1:40]

$fn = 64;

// MODEL
if (Render_Part == "all" || Render_Part == "base") {
    generateBackPlateWithHole();
}
if (Render_Part == "all" || Render_Part == "text") {
    generateKeychainText();
}

// ===============================
// MODULES
// ===============================

// BASE BRANCA + BURACO
module generateBackPlateWithHole() {
    difference() {
        generateBackPlate();  // base branca

        if (Hole_Position != "none") {
            translate([holeX(), holeY(), 0])
                cylinder(h = Plate_Height, r = Hole_Radius);
        }
    }
}

// BASE BRANCA
module generateBackPlate() {

    color(Base_Color)
        linear_extrude(Plate_Height)
            offset(r = Border_Size)
                generateTextShape();

    if (Hole_Position != "none") {
        color(Base_Color)
            hull() {
                translate([holeX(), holeY(), 0])
                    cylinder(h = Plate_Height, r = Hole_Radius + 2);

                translate([holeAnchorX(), holeAnchorY(), 0])
                    cylinder(h = Plate_Height, r = Hole_Radius + 2);
            }
    }
}

// TEXTO AZUL (SEM DIFFERENCE)
module generateKeychainText() {
    color(Text_Color)
        translate([0, 0, Plate_Height])
            linear_extrude(Text_Height)
                generateTextShape();
}

// TEXTO
module generateTextLine(text_str, size_val, font_val, weight_val) {
    // Técnica expand-then-contract: expande 0.1 para unir contornos sobrepostos
    // (resolve buracos em fontes cursivas) e retrai de volta para restaurar o shape.
    effective_weight = (weight_val == 0) ? 0 : weight_val;
    offset(delta = effective_weight - 0.1)
        offset(delta = 0.1)
            text(text_str, size = size_val, font = font_val);
}

// TEXTO
module generateTextShape() {
    union() {
        // LINHA 1
        translate([Offset_L1, 0, 0])
            generateTextLine(Line1_Text, Font_Size_L1, Font_L1, Font_Weight);

        // LINHA 2
        if (Line2_Text != "")
            translate([Offset_L2, -Font_Size_L1 * Spacing_L2, 0])
                generateTextLine(Line2_Text, Font_Size_L2, Font_L2, Font_Weight);

        // LINHA 3
        if (Line3_Text != "")
            translate([Offset_L3, -(Font_Size_L1 * Spacing_L2 + Font_Size_L2 * Spacing_L3), 0])
                generateTextLine(Line3_Text, Font_Size_L3, Font_L3, Font_Weight);
    }
}

// -----------------------------------------------------------------------
// POSIÇÃO DO BURACO – suporta: "right", "left", "top", "bottom", "none"
// holeX/holeY  → centro do furo (externo)
// holeAnchorX/Y → ponto de encosto na borda da placa (para o hull)
// -----------------------------------------------------------------------

// Centro vertical do texto (usado como referência para left/right)
function textCenterY() = -Font_Size_L1 * 0.5;

// Estimativa da largura do texto (usado como referência para top/bottom)
function textWidth() = Font_Size_L1 * len(Line1_Text) * 0.55;

function holeX() =
    (Hole_Position == "right")  ?  textWidth() + Border_Size + Hole_Radius + 2 + Ring_Offset :
    (Hole_Position == "left")   ? -(Border_Size + Hole_Radius + 2 + Ring_Offset) :
    (Hole_Position == "top")    ?  textWidth() * 0.5 + Ring_Offset :
    (Hole_Position == "bottom") ?  textWidth() * 0.5 + Ring_Offset :
    0;

function holeY() =
    (Hole_Position == "right")  ?  textCenterY() + Hole_Height_Offset :
    (Hole_Position == "left")   ?  textCenterY() + Hole_Height_Offset :
    (Hole_Position == "top")    ?  Border_Size + Hole_Radius + 2 + Ring_Offset + Hole_Height_Offset :
    (Hole_Position == "bottom") ? -(Font_Size_L1 + Border_Size + Hole_Radius + 2 + Ring_Offset) + Hole_Height_Offset :
    0;

// Ponto de ancoragem na borda da placa (para o hull criar a lingueta)
function holeAnchorX() =
    (Hole_Position == "right")  ?  textWidth() + Border_Size + Ring_Offset :
    (Hole_Position == "left")   ?  Ring_Offset :
    (Hole_Position == "top")    ?  textWidth() * 0.5 + Ring_Offset :
    (Hole_Position == "bottom") ?  textWidth() * 0.5 + Ring_Offset :
    0;

function holeAnchorY() =
    (Hole_Position == "right")  ?  textCenterY() + Hole_Height_Offset :
    (Hole_Position == "left")   ?  textCenterY() + Hole_Height_Offset :
    (Hole_Position == "top")    ?  Border_Size + Ring_Offset + Hole_Height_Offset :
    (Hole_Position == "bottom") ? -(Font_Size_L1 + Border_Size + Ring_Offset) + Hole_Height_Offset :
    0;

