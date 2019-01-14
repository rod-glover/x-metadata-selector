// Grouping selector. This component returns a React Select v2 selector with
// a set of options constructed from a list of basis items, many of which
// may be coalesced into (i.e., represented by) a single select option.
//
// It works as follows:
//
//  - Each element of the basis list is mapped to a value (which can be an
//    arbitrary JS object) that represents it. Many basis elements can map
//    to the same value. The user supplies the function that maps basis item
//    to representative value.
//
//  - Each unique representative value becomes an option in the selector.
//    An option is an object containing the following properties:
//
//      - `value`: The representative value.
//
//      - `contexts`: The list of all basis items which mapped to this value.
//
//        This list can be used to determine enabled/disabled status of an
//        option, for example.
//
//      - `isDisabled`: Set to `true` if the option is disabled.
//
//        The user supplies the function that maps an option to the value for
//        `isDisabled`. This function can refer to `option.value` and
//        `option.contexts`.
//
//      - `label`: The string presented to the user to represent the option.
//
//        The user supplies the function that maps an option to the label
//        string.
//
//  - The list of generated options is finally passed through a user-supplied
//    function `arrangeOptions` that can be used to sort options, form option
//    groups, or otherwise ready them for consumption by the rendered React
//    Select v2 selector.
//
//  - Selection is communicated (via props `value`, `onChange`) as the
//    option value only. (This differs from React Select v2, which communicates
//    the entire option value, and may or may not be a wise choice.)
//
//  - If an invalid value is supplied to the selector, it is replaced with the
//    value returned by the function prop `replaceInvalidValue`.

import PropTypes from 'prop-types';
import React from 'react';
import Select from 'react-select';

import memoize from 'memoize-one';

import {
  assign,
  flow,
  constant,
  identity,
  map,
  flatMap,
  find,
  sortBy,
  some,
  tap,
  isEqual,
  isUndefined,
  isArray,
  noop,
} from 'lodash/fp';
import { groupByGeneral } from '../../utils/fp';

import objectId from '../../debug-utils/object-id';

import './GroupingSelector.css';

export default class GroupingSelector extends React.Component {
  static propTypes = {
    bases: PropTypes.array.isRequired,
    // List of basis items the selector will build its options from.

    getOptionValue: PropTypes.func.isRequired,
    // Maps a basiss item to the `value` property of an option.
    // This function can map many basis items to the same value;
    // GroupingSelector collects all basis items with the same
    // value into a single option.

    getOptionLabel: PropTypes.func,
    // Maps an option to the label (a string) for that option.

    getOptionIsDisabled: PropTypes.func,
    // Maps an option to a value for its isDisabled property.
    // Typically makes use of option.context to determine this.

    arrangeOptions: PropTypes.func,
    // Arranges options for consumption by Select.
    // This may mean sorting options, grouping options (as provided for
    // by Select), or any other operation(s) that arrange the options
    // for presentation in Select.

    components: PropTypes.any,

    value: PropTypes.any,
    // The currently selected option.

    onChange: PropTypes.func,
    // Called when a different option is selected.

    replaceInvalidValue: PropTypes.func,
    // Called when value passed in is not a valid value.
    // Called with list of all options.
    // Must return a valid value.
    // Beware: If you return an invalid value from this, you're screwed.
    
    debugValue: PropTypes.any,
  };

  static defaultProps = {
    getOptionLabel: option => option.value.toString(),
    getOptionIsDisabled: constant(false),
    arrangeOptions: options => sortBy('label')(options),
    replaceInvalidValue: options => {
      console.log(`replaceInvalidValue: options`, options)
      const allOptions =
        options[0] && isArray(options[0].options) ?
        flatMap('options')(options) :
        options;
      console.log(`replaceInvalidValue: allOptions`, allOptions)
      const firstEnabledOption = find({ isDisabled: false }, allOptions);
      console.log(`replaceInvalidValue: firstEnabledOption`, firstEnabledOption)
      return firstEnabledOption && firstEnabledOption.value;
    },
    // Replace with first enabled option.
    onChange: noop,
    debugValue: '',
  };

  constructor(props) {
    super(props);
    console.log(`MetadataSelector[${this.props.debugValue}].cons: meta:`, objectId(props.bases), props.bases)
  }

  componentDidMount() {
    console.log(`MetadataSelector[${this.props.debugValue}].componentDidMount`)
  }

  componentDidUpdate(prevProps) {
    console.log(`MetadataSelector[${this.props.debugValue}].cDU: meta:`, objectId(this.props.bases))
    console.log(`MetadataSelector[${this.props.debugValue}].componentDidMount: props.meta ${this.props.bases === prevProps.bases ? '===' : '!=='} prevProps.meta`)
  }

  // Memoize computation of options list
  // See https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization

  // Form the list of all options (without isDisabled property) from the
  // list of metadata. An option item has the following form:
  //
  //  {
  //    value: <object>
  //      The value of the option; exchanged through props.value
  //      and props.onChange.
  //    contexts: [ <object> ]
  //      The contexts in which the option occurs. A context is a
  //      basis item from which an equal option value is generated.
  //      (Contexts are often used to determine enabled/disabled status,
  //      but this function is not concerned with that status.)
  //    label: <string>
  //      The label for the option that appears in the selector UI.
  //  }
  //
  // This function is memoized because otherwise it would have to reprocess
  // the large list of metadata (`props.bases`) into options every time this
  // component is rendered, which, amongst other cases, is every time a
  // selection is made. Also, this function is potentially called multiple
  // times per render, depending on the behaviour of downstream functions
  // such as `constrainedOptions` and `props.arrangeOptions`.
  allOptions = memoize(
    (getOptionValue, getOptionLabel, meta) =>
      flow(
        tap(meta => console.log(`MetadataSelector[${this.props.debugValue}].allOptions: meta:`, objectId(meta), meta)),
        map(m => ({
          context: m,
          value: getOptionValue(m),
        })),
        groupByGeneral(({ value }) => value),
        map(group => ({
            contexts: map(item => item.context)(group.items),
            value: group.by,
        })),
        map(option => assign(option, { label: getOptionLabel(option) })),
        // tap(m => console.log(`GroupingSelector[${this.props.debugValue}].allOptions`, m)),
      )(meta)
  );

  // Form the list of constrained options from the list of metadata.
  // A constrained option is an option with isDisabled set according to
  // `props.getOptionIsDisabled`.
  constrainedOptions = memoize(
    (getOptionIsDisabled, meta) => flow(
      tap(options => {
        console.log(`MetadataSelector[${this.props.debugValue}].constrainedOptions: meta:`, objectId(meta), meta, 'getOptionIsDisabled:', objectId(getOptionIsDisabled));
        console.log(`MetadataSelector[${this.props.debugValue}].constrainedOptions: options:`, objectId(options), options);
      }),
      map(option =>
        assign(option, { isDisabled: getOptionIsDisabled(option) })),
      tap(options => console.log(`MetadataSelector[${this.props.debugValue}].constrainedOptions: result`, options))
    )(
      // Can't curry a memoized function; have to put it into the flow manually
      this.allOptions(
        this.props.getOptionValue,
        this.props.getOptionLabel,
        meta
      )
    )
  );

  // Value-exchange functions

  isValidValue = value => some(
    option => !option.isDisabled && isEqual(option.value, value)
  )(this.constrainedOptions(this.props.getOptionIsDisabled, this.props.bases));

  optionFor = value => find(
    option => isEqual(option.value, value),
    this.constrainedOptions(this.props.getOptionIsDisabled, this.props.bases)
  );

  handleChange = option => this.props.onChange(option.value);

  render() {
    console.log(`MetadataSelector[${this.props.debugValue}].render`)
    // TODO: Pass through all the Select props.

    console.log(`MetadataSelector[${this.props.debugValue}].render: arrangedOptions: meta:`, objectId(this.props.bases), this.props.bases)
    const arrangedOptions =
      this.props.arrangeOptions(
        this.constrainedOptions(
          this.props.getOptionIsDisabled,
          this.props.bases,
        ));
    console.log(`MetadataSelector[${this.props.debugValue}].render: arrangedOptions: result:`, arrangedOptions)


    let valueToUse = this.props.value;
    if (!this.isValidValue(valueToUse)) {
      console.log(`MetadataSelector[${this.props.debugValue}].render: valueToUse`)
      valueToUse = this.props.replaceInvalidValue(
        // this.constrainedOptions(this.props.getOptionIsDisabled, this.props.bases)
        arrangedOptions
      );
      this.props.onChange(valueToUse);
    }

    console.log(`MetadataSelector[${this.props.debugValue}].render: return`)
    return (
      <Select
        isSearchable
        options={arrangedOptions}
        components={this.props.components}
        value={this.optionFor(valueToUse)}
        onChange={this.handleChange}
      />
    );
  }
}
