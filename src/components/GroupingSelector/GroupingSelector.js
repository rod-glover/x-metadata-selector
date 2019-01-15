// Grouping selector. This component returns a React Select v2 selector with
// a set of options constructed from a list of basis items, many of which
// may be coalesced into (i.e., represented by) a single select option.
//
// The motivation for this selector is to unify the various metadata-based
// selectors (for model, emissions, variable, dataset). Each one reduces
//  a list of metadata items (objects containing props that characterize
//  a dataset, such as model, emissions, variable, start and end date, etc.).
// Each such selector reduces the entire list of metadata to a smaller list
// of unique values that represent a single characteristic (e.g., model).
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
//        The user supplies the function `getOptionIsDisabled` that maps an
//        option to the value for `isDisabled`. This function can refer to
//        `option.value` and `option.contexts`. By default,
//        `getOptionIsDisabled` always returns `false` (option enabled).
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
//    By default, `arrangeOptions` sorts the options by the label string.
//
//  - The active selection is communicated, via props `value` and `onChange`,
//    as the option value only. (This differs from React Select v2,
//    which communicates the entire option value. Introducing this difference
//    may or may not prove wise; it is convenient for the immeidate application
//    in Climate Exporer.)
//
//  - If an invalid value is supplied to the selector, it is replaced with the
//    value returned by the function prop `replaceInvalidValue`. An invalid
//    value is any value that does not match an enabled option value, or `null`.
//    `null` is a valid value, and has the universal meaning, 'no selection'.
//    Warning: This function must return a valid value, or an error will occur.
//    By default, `replaceInvalidValue` is a function that returns the value
//    of the first enabled option.

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
  isArray,
  isFunction,
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
    // Beware: If you always return an invalid value from this, you're screwed.
    
    debug: PropTypes.bool,
    debugValue: PropTypes.any,
    // For debugging, what else?
  };

  static defaultProps = {
    getOptionLabel: option => option.value.toString(),

    getOptionIsDisabled: constant(false),

    arrangeOptions: options => sortBy('label')(options),

    replaceInvalidValue: options => {
      // Return first (in order of UI presentation) enabled option,
      // or else null if no such option exists.
      const allOptions =
        options[0] && isArray(options[0].options) ?
          flatMap('options')(options) :  // grouped
          options;                       // ungrouped
      const firstEnabledOption = find({ isDisabled: false }, allOptions);
      console.log(`GroupingSelector[...].replaceInvalidValue: firstEnabledOption:`, firstEnabledOption)
      // This is sketchy, because if there is never any enabled option,
      // it always returns `undefined`, which is invalid, and causes an infinite
      // update loop. OTOH, if we convert the undefined to `null`, it can
      // prematurely update the value to `null`, and that is both stable
      // and wrong. This works for now.
      // FIXME by adjusting the logic for replacement to allow checking for
      // a valid value in the case that the last value was null. Then use
      // the commented out line below to convert undefined to null.
      return firstEnabledOption && firstEnabledOption.value;
      // return firstEnabledOption ? firstEnabledOption.value : null;
    },

    onChange: noop,

    debug: false,
    debugValue: '',
  };
  
  log(...args) {
    if (this.props.debug) {
      console.log(`GroupingSelector[${this.props.debugValue}]`, ...args);
    }
  }

  condReplaceValue() {
    if (this.willReplaceValue) {
      this.log(`.updateInvalidValue: replacing with value:`, this.valueToUse)
      this.props.onChange(this.valueToUse);
    }
  }

  constructor(props) {
    super(props);
    this.log(`.cons: meta:`, objectId(props.bases), props.bases)
  }

  componentDidMount() {
    this.condReplaceValue();
  }

  componentDidUpdate(prevProps) {
    this.log(`.cDU: meta:`, objectId(this.props.bases))
    this.log(`.componentDidMount: props.meta ${this.props.bases === prevProps.bases ? '===' : '!=='} prevProps.meta`)
    this.condReplaceValue();
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
  // the large list of basis items (`props.bases`) into options every time this
  // component is rendered, which, amongst other cases, is every time a
  // selection is made. Also, this function is potentially called multiple
  // times per render, depending on the behaviour of downstream functions
  // such as `constrainedOptions` and `props.arrangeOptions`.
  allOptions = memoize(
    (getOptionValue, getOptionLabel, meta) =>
      flow(
        tap(meta => this.log(`.allOptions: meta:`, objectId(meta), meta)),
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
        // tap(m => this.log(`.allOptions`, m)),
      )(meta)
  );

  // Form the list of constrained options from the list of metadata.
  // A constrained option is an option with isDisabled set according to
  // `props.getOptionIsDisabled`.
  constrainedOptions = memoize(
    (getOptionIsDisabled, meta) => flow(
      tap(options => {
        this.log(`.constrainedOptions: meta:`, objectId(meta), meta, 'getOptionIsDisabled:', objectId(getOptionIsDisabled));
        this.log(`.constrainedOptions: options:`, objectId(options), options);
      }),
      map(option =>
        assign(option, { isDisabled: getOptionIsDisabled(option) })
      ),
      tap(options => this.log(`.constrainedOptions: result`, options))
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
  // `null` is a valid value and means 'no selection'.
  // `undefined` is not a valid value.

  isValidValue = value =>
    // A value is valid if it is null or if it is (deep) equal to the value of
    // some enabled option.
    value === null ||
    some(
      option => !option.isDisabled && isEqual(option.value, value),
      this.constrainedOptions(this.props.getOptionIsDisabled, this.props.bases)
    );

  optionFor = value =>
    // The option for a value is null if the value is null, or the option
    // whose value (deep) equals the value.
    value === null ?
      null :
      find(
        option => isEqual(option.value, value),
        this.constrainedOptions(this.props.getOptionIsDisabled, this.props.bases)
      );

  handleChange = option => this.props.onChange(option.value);

  render() {
    this.log(`.render`)
    // TODO: Pass through all the Select props.

    this.log(`.render: arrangedOptions: meta:`, objectId(this.props.bases), this.props.bases)
    const arrangedOptions =
      this.props.arrangeOptions(
        this.constrainedOptions(
          this.props.getOptionIsDisabled,
          this.props.bases,
        ));
    this.log(`.render: arrangedOptions: result:`, arrangedOptions)

    // The following two values are picked up in `componentDidMount` and
    // `componentDidUpdate` to call back (`onChange`) with the replaced value.
    // React lifecycle prevents doing that here, because it ultimately causes
    // a state change in the parent's render, which is forbidden.
    this.willReplaceValue =
      isFunction(this.props.replaceInvalidValue) &&
      !this.isValidValue(this.props.value);
    this.valueToUse =
      this.willReplaceValue ?
        this.props.replaceInvalidValue(arrangedOptions) :
        this.props.value
    ;

    this.log(`.render: return`)
    return (
      <Select
        {...this.props}
        options={arrangedOptions}
        value={this.optionFor(this.valueToUse)}
        onChange={this.handleChange}
      />
    );
  }
}
