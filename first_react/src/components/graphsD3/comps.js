/*import React from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

export const GridLine = ({
    type, scale, ticks, size, transform, disableAnimation, ...props
}) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        const axisGenerator = type === "vertical" ? d3.axisBottom : d3.axisLeft;
        const axis = axisGenerator(scale).ticks(ticks).tickSize(-size);

        const gridGroup = d3.select(ref.current);
        if (disableAnimation) {
            gridGroup.call(axis);
        } else {
            gridGroup.transition().duration(750).ease(d3.easeLinear).call(axis);
        }
        gridGroup.select(".domain").remove();
        gridGroup.selectAll("text").remove();
        gridGroup.selectAll("line").attr("stroke", "rgba(255, 255, 255, 0.1)");
    }, [scale, ticks, size, disableAnimation]);

    return <g ref={ref} transform={transform} {...props} />;
};

GridLine.propTypes = {
    type: PropTypes.oneOf(["vertical", "horizontal"]).isRequired
};

export const Line = ({
    xScale, yScale, color, data, animation, ...props
}) => {
    const ref = React.useRef(null);
    // Define different types of animation that we can use
    const animateLeft = React.useCallback(() => {
        const totalLength = ref.current.getTotalLength();
        d3.select(ref.current)
            .attr("opacity", 1)
            .attr("stroke-dasharray", `${totalLength},${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(750)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    }, []);
    const animateFadeIn = React.useCallback(() => {
        d3.select(ref.current)
            .transition()
            .duration(750)
            .ease(d3.easeLinear)
            .attr("opacity", 1);
    }, []);
    const noneAnimation = React.useCallback(() => {
        d3.select(ref.current).attr("opacity", 1);
    }, []);

    React.useEffect(() => {
        switch (animation) {
            case "left":
                animateLeft();
                break;
            case "fadeIn":
                animateFadeIn();
                break;
            case "none":
            default:
                noneAnimation();
                break;
        }
    }, [animateLeft, animateFadeIn, noneAnimation, animation]);

    // Recalculate line length if scale has changed
    React.useEffect(() => {
        if (animation === "left") {
            const totalLength = ref.current.getTotalLength();
            d3.select(ref.current).attr(
                "stroke-dasharray",
                `${totalLength},${totalLength}`
            );
        }
    }, [xScale, yScale, animation]);

    const line = d3.line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value));

    return (
        <path
            ref={ref}
            d={line(data)}
            stroke={color}
            strokeWidth={3}
            fill="none"
            opacity={0}
            {...props}
        />
    );
};


const Axis = ({
  type, scale, ticks, transform, tickFormat, disableAnimation, ...props
}) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const axisGenerator = type === "left" ? d3.axisLeft : d3.axisBottom;
    const axis = axisGenerator(scale).ticks(ticks).tickFormat(tickFormat);
    const axisGroup = d3.select(ref.current);
    if (disableAnimation) {
      axisGroup.call(axis);
    } else {
      axisGroup.transition().duration(750).ease(d3.easeLinear).call(axis);
    }
    axisGroup.select(".domain").remove();
    axisGroup.selectAll("line").remove();
    axisGroup.selectAll("text")
      .attr("opacity", 0.5)
      .attr("color", "white")
      .attr("font-size", "0.75rem");
  }, [scale, ticks, tickFormat, disableAnimation]);
 
  return <g ref={ref} transform={transform} {...props} />;
};


export const Axis = ({ anchorEl, ...props }) => {
    const ref = React.useRef(null);
    // Add new hook to handle mouse events
    React.useEffect(() => {
        d3.select(anchorEl)
            .on("mouseout.axisX", () => {
                d3.select(ref.current)
                    .selectAll("text")
                    .attr("opacity", 0.5)
                    .style("font-weight", "normal");
            })
            .on("mousemove.axisX", () => {
                const [x] = d3.mouse(anchorEl);
                const xDate = scale.invert(x);
                const textElements = d3.select(ref.current).selectAll("text");
                const data = textElements.data();
                const index = d3.bisector((d) => d).left(data, xDate);
                textElement
                    .attr("opacity", (d, i) => (i === index - 1 ? 1 : 0.5))
                    .style("font-weight", (d, i) => i === index - 1 ? "bold" : "normal");
            });
    }, [anchorEl, scale]);

    return <g ref={ref} transform={transform} {...props} />;
};

Axis.propTypes = {
    type: PropTypes.oneOf(["left", "bottom"]).isRequired
};

export const Area = ({ xScale, yScale, color, data, disableAnimation, ...props }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (disableAnimation) {
            d3.select(ref.current).attr("opacity", 1);
            return;
        }
        d3.select(ref.current).transition()
            .duration(750)
            .ease(d3.easeBackIn)
            .attr("opacity", 1);
    }, [disableAnimation]);

    const d = React.useMemo(() => {
        const area = d3.area()
            .x(({ date }) => xScale(date))
            .y1(({ value }) => yScale(value))
            .y0(() => yScale(yScale.domain()[0]));
        return area(data);
    }, [xScale, yScale, data]);

    return (
        <>
            <path ref={ref} d={d} fill={`url(#gradient-${color})`} opacity={0} {...props} />
            <defs>
                <linearGradient id={`gradient-${color}`} x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
        </>
    );
};*/