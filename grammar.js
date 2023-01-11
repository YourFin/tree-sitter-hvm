module.exports = grammar({
  name: 'hvm',
  rules: {
    source_file: $ => seq(repeat($.rule), optional($._ws)),
    rule: $ => seq(
      optional($._ws),
      field('lhs', $._term),
      optional($._ws),
      '=',
      optional($._ws),
      field('rhs', $._term)
    ),
    _term: $ => choice(
      $.let,
      $.dup,
      $.lam,
      $.ctr, // constructor
      //$.op2,
      //$.app,
      //$.sup,
      $._num,
      //$.sym_sugar,
      //$.chr_sugar,
      //$.str_sugar,
      //$.if_sugar,
      //$.bng, // bang
      //$.ask_sugar_named,
      //$.ask_sugar_anon,
      $.var, // var in ast
    ),
    let: $ => seq(
      'let',
      $._ws,
      field('name', $.identifier),
      $._ws,
      field('expr', $._term),
      optional($._ws), // ?
      ';',
      optional($._ws), // ?
      field('body', $._term),
    ),

    dup: $ => seq(
      'dup',
      $._ws,
      field('name0', $.identifier),
      $._ws,
      field('name1', $.identifier),
      optional($._ws), // ?
      '=',
      optional($._ws), // ?
      field('expr', $._term),
      optional($._ws), // ?
      field('body', $._term),
    ),

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L236
    lam: $ => seq(
      /[@λ]/,
      // Add optional whitespace here?
      field('name', $.identifier),
      $._ws,
      field('body', $._term),
    ),


    ctr: $ => seq('/[A-Z]/', repeat($._identifier_char)),

    _num: $ => choice(
      $.U60_dec_literal,
      $.U60_hex_literal,
      $.F60_literal,
    ),
    U60_dec_literal: $ => /\d(_?\d)*/,
    U60_hex_literal: $ => seq(/0[xX]/, /[0-9a-fA-F](_?[0-9a-fA-F])/),
    F60_literal: $ => /\d(_?\d)*(\.\d)?(_?\d)*([eE][\+-]?\d(_?\d)*)?/,

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L373
    var: $ => seq('/[a-z_$]/', repeat($._identifier_char)),
    comment: $ => seq('//', /.*/),
    _ws: $ => /\s+/,
    // https://github.com/Kindelia/HVM/blob/4974a8ae7c83b775aaf627719e638d06dac4a4dc/src/language/parser.rs#L352
    _identifier_char: $ => choice(/\w/, '.', '$'),
    identifier: $ => repeat1($._identifier_char),
  },
  extras: $ => [
    $._ws,
    $.comment,
  ],
})

