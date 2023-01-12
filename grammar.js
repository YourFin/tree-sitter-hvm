const PREC = {
  first_keyword_form: $ => prec(100, $),
  second_keyword_form: $ => prec(99, $),
  // default: 0
  default: $ => prec(0, $),
  identifier: $ => prec(-1, $),
  app: $ => prec(-2, $),
}
const identifier_char = /[\w$.]/

function paren(...rules) {
  return seq(...['(', ...rules, ')'])
}


module.exports = grammar({
  name: 'hvm',
  inline: $ => [
    $._identifier_char
  ],
  extras: $ => [
    $._ws,
    $._comment,
  ],
  word: $ => $.identifier,
  supertypes: $ => [
    $._term,
    $._num,
    $._oper,
  ],
  rules: {
    source_file: $ =>
      //seq($.lst_sugar, optional($._ws)),
      repeat(seq($.rule, optional($._ws))),


    rule: $ => seq(
      field('lhs', $._term),
      '=',
      field('rhs', $._term)
    ),
    _term: $ => choice(
      $._leading_term,
      alias($._ctr_sugar, $.ctr),
    ),
    _leading_term: $ => choice(
      PREC.first_keyword_form($.let),
      PREC.first_keyword_form($.dup),
      PREC.first_keyword_form($.lam),
      $.ctr, // constructor
      $.op2,
      PREC.app($.app),
      $.sup,
      $._num,
      PREC.app($.sym_sugar),
      $.chr_sugar,
      $.str_sugar,
      $.lst_sugar,
      PREC.first_keyword_form($.if_sugar),
      $.bng, // bang
      PREC.first_keyword_form($.ask_sugar),
      PREC.identifier($.variable), // var in ast
    ),
    let: $ => seq(
      'let',
      field('name', $.identifier),
      '=',
      field('expr', $._term),
      optional(';'),
      field('body', $._term),
    ),

    dup: $ => seq(
      'dup',
      $._sep,
      field('name0', $.identifier),
      $._sep,
      field('name1', $.identifier),
      //optional($._sep), // ?
      '=',
      //optional($._sep), // ?
      field('expr', $._term),
      //optional($._sep), // ?
      optional(';'),
      field('body', $._term),
    ),

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L236
    lam: $ => seq(
      /[@λ]/,
      // Whitespace here not in actual spec
      field('name', $.identifier),
      field('body', $._term),
    ),

    ctr: $ => paren(
      field('name', $._ctrIdentifier),
      field('arg', repeat($._term)),
    ),
    _ctr_sugar: $ => field('name', $._ctrIdentifier),
    _ctrIdentifier: $ => PREC.identifier(alias(/[A-Z][\w$.]*/, $.identifier)),

    op2: $ => paren(
      field('oper', $._oper),
      field('val0', $._term),
      field('val1', $._term),
    ),
    _oper: $ => choice(
      $.oper_add,
      $.oper_sub,
      $.oper_mul,
      $.oper_div,
      $.oper_mod,
      $.oper_and,
      $.oper_or,
      $.oper_xor,
      $.oper_shl,
      $.oper_shr,
      $.oper_lte,
      $.oper_ltn,
      $.oper_eql,
      $.oper_gte,
      $.oper_gtn,
      $.oper_neq,
    ),
    oper_add: _ => '+',
    oper_sub: _ => '-',
    oper_mul: _ => '*',
    oper_div: _ => '/',
    oper_mod: _ => '%',
    oper_and: _ => '&',
    oper_or:  _ =>'|',
    oper_xor: _ => '^',
    oper_shl: _ => '<<',
    oper_shr: _ => '>>',
    oper_lte: _ => '<=',
    oper_ltn: _ => '<',
    oper_eql: _ => '==',
    oper_gte: _ => '>=',
    oper_gtn: _ => '>',
    oper_neq: _ => '!=',

    app: $ => paren(optional(seq($._leading_term, repeat($._term)))),

    sup: $ => seq(
      '{',
      field('val0', $._term),
      field('val1', $._term),
      '}',
    ),

    _num: $ => choice(
      $.U60_dec_literal,
      $.U60_hex_literal,
      $.F60_literal,
    ),
    U60_dec_literal: $ => /\d(_?\d)*/,
    U60_hex_literal: $ => seq(/0[xX]/, /[0-9a-fA-F](_?[0-9a-fA-F])/),
    F60_literal: $ => /\d(_?\d)*(\.\d)?(_?\d)*([eE][\+-]?\d(_?\d)*)?/,

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L387
    sym_sugar: $ => token(seq('%', token.immediate(/[\w$.]+/))),

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L443
    chr_sugar: $ => token(/'.'/),

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L464
    str_sugar: $ => choice(/"[^"\x00]+["\x00]/, /`[^`\x00]+[`\x00]/),

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L497
    lst_sugar: $ => seq('[', repeat($._term), ']'),

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L527
    if_sugar: $ => seq(
      'if',
      field('condition', $._term),
      '{',
      field('t_term', $._term),
      '}',
      'else',
      '{',
      field('f_term', $._term),
      '}',
    ),

    bng: $ => seq('!', $._term),

    ask_sugar: $ => seq(
      'ask',
      // TODO: Get this working
      PREC.first_keyword_form(field('var_name', optional(seq(
        $.identifier,
        '=')))),
      PREC.app(field('func', $._term)),
      optional(';'),
      field('body', $._term),
    ),

    // https://github.com/Kindelia/HVM/blob/68769b257924920b24f7ded43a39ded58d8cbdf3/src/language/syntax.rs#L373
    variable: $ => alias(/[a-z_$.][\w$.]*/, $.identifier),
    _comment: $ => /\/\/.*/,
    _ws: $ => /\s/,
    // https://github.com/Kindelia/HVM/blob/4974a8ae7c83b775aaf627719e638d06dac4a4dc/src/language/parser.rs#L352
    identifier: $ => token(repeat1(identifier_char)),
    _sep: $ => repeat1(choice($._comment, $._ws)),
  },
})
