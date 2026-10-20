// Verilog-2001 examples for textbook exercises 4.33--4.36.
// Exercise 4.33 follows exercise 4.7 in the supplied textbook.

module bin_to_gray4 (
    input  wire [3:0] b,
    output wire [3:0] g
);
    assign g[3] = b[3];
    assign g[2] = b[3] ^ b[2];
    assign g[1] = b[2] ^ b[1];
    assign g[0] = b[1] ^ b[0];
endmodule

module mux4_beh (
    input  wire [3:0] d,
    input  wire [1:0] sel,
    output reg        y
);
    always @* begin
        case (sel)
            2'b00: y = d[0];
            2'b01: y = d[1];
            2'b10: y = d[2];
            2'b11: y = d[3];
            default: y = 1'b0;
        endcase
    end
endmodule

module cla4 (
    input  wire [3:0] a,
    input  wire [3:0] b,
    input  wire       ci,
    output wire [3:0] s,
    output wire       co
);
    wire [3:0] g, p;
    wire [4:0] c;

    assign g = a & b;
    assign p = a | b;
    assign c[0] = ci;

    assign c[1] = g[0] | (p[0] & ci);
    assign c[2] = g[1] | (p[1] & g[0])
                         | (p[1] & p[0] & ci);
    assign c[3] = g[2] | (p[2] & g[1])
                         | (p[2] & p[1] & g[0])
                         | (p[2] & p[1] & p[0] & ci);
    assign c[4] = g[3] | (p[3] & g[2])
                         | (p[3] & p[2] & g[1])
                         | (p[3] & p[2] & p[1] & g[0])
                         | (p[3] & p[2] & p[1] & p[0] & ci);

    assign s = a ^ b ^ c[3:0];
    assign co = c[4];
endmodule

module binaryToESeg (
    input  wire A,
    input  wire B,
    input  wire C,
    input  wire D,
    output wire eSeg
);
    wire nB, nD;
    wire p1, p2, p3, p4;

    not invB(nB, B);
    not invD(nD, D);
    nand g1(p1, C, nD);
    nand g2(p2, A, B);
    nand g3(p3, nB, nD);
    nand g4(p4, A, C);
    nand g5(eSeg, p1, p2, p3, p4);
endmodule
